import React from "react";
import {
  BehaviorSubject,
  combineLatest,
  empty,
  merge,
  Observable,
  Subject,
} from "rxjs";
import { map, startWith } from "rxjs/operators";

import { M } from "./M";

export interface TextInputConfig {
  initialValue: string;
  setValue: Observable<string>;
  attributes: Observable<JSX.IntrinsicElements["input"]>;
}

const defConfig = {
  attributes: empty(),
  initialValue: "",
  setValue: empty(),
};

export interface Outputs {
  value: Observable<string>;
  change: Observable<string>;
  keypress: Observable<number>;
  keydown: Observable<number>;
  keyup: Observable<number>;
  hasFocus: Observable<boolean>;
}

export const textInput = (
  inputConfig: Partial<TextInputConfig>,
): M<Outputs> => {
  const { attributes, setValue, initialValue } = Object.assign(
    {},
    defConfig,
    inputConfig,
  );

  const change = new Subject<string>();
  const onChange: React.InputHTMLAttributes<HTMLInputElement>["onChange"] = e =>
    change.next(e.target.value);

  const keypress = new Subject<number>();
  const onKeyPress: React.InputHTMLAttributes<
    HTMLInputElement
  >["onKeyPress"] = e => keypress.next(e.charCode);
  const keydown = new Subject<number>();
  const onKeyDown: React.InputHTMLAttributes<
    HTMLInputElement
  >["onKeyDown"] = e => keydown.next(e.charCode);
  const keyup = new Subject<number>();
  const onKeyUp: React.InputHTMLAttributes<HTMLInputElement>["onKeyUp"] = e =>
    keyup.next(e.charCode);
  const hasFocus = new BehaviorSubject(false);
  const onBlur = () => hasFocus.next(false);
  const onFocus = () => hasFocus.next(true);

  const dynSetValue = setValue.pipe(startWith(initialValue));
  const value = merge(dynSetValue, change);

  // TODO use attributes
  const eles$ = combineLatest(dynSetValue, attributes).pipe(
    map(([val, attrs]) => [
      // tslint:disable-next-line:jsx-key
      <input
        {...attrs}
        value={val}
        onChange={onChange}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    ]),
  );
  return {
    elements: eles$,
    value: { value, change, keypress, keydown, keyup, hasFocus },
  };
};
