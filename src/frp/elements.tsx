import React from "react";
import { combineLatest, Observable, of } from "rxjs";
import { map, switchAll } from "rxjs/operators";

import { DoBlock, M, mdo } from "./M";

export function dyn<T>(dynM: Observable<M<T>>): M<Observable<T>> {
  const foo: Observable<Observable<React.ReactNode[]>> = dynM.pipe(
    map(m => m.elements),
  );
  const bar: Observable<React.ReactNode[]> = foo.pipe(switchAll());
  const elements = bar;

  const value: Observable<T> = dynM.pipe(map(m => m.value));
  return { elements, value };
}

export const text = (content: string): M<void> => dynText(of(content));

export const dynText = (content: Observable<string>): M<void> => ({
  elements: content.pipe(map(s => [s])),
  value: undefined,
});

export function el<T>(
  tag:
    | string
    | React.StatelessComponent<object>
    | React.ComponentClass<object, any>,
  props$: Observable<object>,
  doBlockOrM: DoBlock<T> | M<T>,
): M<T> {
  const childM =
    typeof doBlockOrM === "function" ? mdo(doBlockOrM) : doBlockOrM;
  const ele$ = combineLatest(childM.elements, props$).pipe(
    map(([children, props]) => [React.createElement(tag, props, ...children)]),
  );
  return { elements: ele$, value: childM.value };
}

export function list<T, R>(
  values$: Observable<T[]>,
  childFn: (val: T) => M<R>,
): M<Observable<R[]>> {
  // TODO split into multiple steps for clarity
  return dyn(
    values$.pipe(
      map(values => mdo(b => values.map(value => b(childFn(value))))),
    ),
  );
}

export { textInput } from "./textInput";
