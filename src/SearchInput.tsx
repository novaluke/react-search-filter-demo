import React from "react";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import { Spring } from "react-spring";
import {
  compose,
  defaultProps as withDefaultProps,
  StateHandlerMap,
  withStateHandlers,
} from "recompose";
import {
  distinctUntilChanged,
  filter,
  map,
  skip,
  withLatestFrom,
} from "rxjs/operators";

import { mapPropsStream } from "./streamHelpers";

import "./SearchInput.css";

interface ChangeEvent {
  target: { value: string };
}

export interface Props {
  onChange: (value: string) => void;
  setValue?: string;
  closedWidth?: number;
  openWidth?: number;
  color?: string;
}

interface State {
  isOpen: boolean;
  value: string;
}

interface Handlers {
  handleChange: (e: ChangeEvent) => void; // `onChange` is already taken by Props
  onFocus: () => void;
  onBlur: () => void;
  reset: () => void;
}

type ComponentProps = Props & State & Handlers;

const initialState: State = { isOpen: false, value: "" };

const defaultProps: Partial<Props> = {
  closedWidth: 5,
  color: "white",
  openWidth: 200,
};

const SearchInputComponent: React.SFC<ComponentProps> = ({
  // Props
  closedWidth,
  openWidth,
  color,
  // State
  isOpen,
  value,
  // Handlers
  handleChange,
  onFocus,
  onBlur,
  reset,
}) => (
  <label
    className="search-input-container"
    style={{ color, borderColor: color }}
  >
    <Spring
      from={{ width: closedWidth }}
      to={{ width: isOpen ? openWidth : closedWidth }}
    >
      {({ width }) => (
        <input
          type="text"
          value={value}
          className="search-input-textinput"
          style={{ width }}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={isOpen ? "Search for Media..." : ""}
        />
      )}
    </Spring>
    {value ? (
      <FaTimesCircle className="search-input-icon" onClick={reset} />
    ) : (
      <FaSearch className="search-input-icon" />
    )}
  </label>
);

export const SearchInput = compose<ComponentProps, Props>(
  withDefaultProps(defaultProps),
  withStateHandlers<State, StateHandlerMap<State>, Props>(initialState, {
    handleChange: () => ({ target: { value } }: ChangeEvent) => ({ value }),
    onBlur: ({ value }) => () => (value ? undefined : { isOpen: false }),
    onFocus: () => () => ({ isOpen: true }),
    reset: () => () => ({ value: "" }),
  }),
  mapPropsStream<ComponentProps, ComponentProps>(props$ => {
    // Any time the value is changed due to internal state, use the `onChange`
    // function to notify the parent component. Note: it's important to only use
    // the *internal* state stream for this, as including `setValue` in the
    // stream could cause an infinite loop (besides, the parent already knows
    // when it's triggered `setValue`).
    props$
      .pipe(
        map(({ value }) => value),
        skip(1), // Don't trigger from `initialState` being set
        distinctUntilChanged(),
        withLatestFrom(props$),
      )
      .subscribe(([value, { onChange }]) => onChange(value));

    // When setValue is changed (and defined), trigger the value changed
    // handler. It would be possible to merge the value back in to `props$` to
    // be returned, but given a handler is already defined for that purpose
    // using it is more DRY.
    props$
      .pipe(
        map(({ setValue }) => setValue),
        filter((value): value is string => typeof value === "string"),
        distinctUntilChanged(),
        withLatestFrom(props$),
      )
      .subscribe(([value, { handleChange }]) =>
        handleChange({ target: { value } }),
      );

    return props$;
  }),
)(SearchInputComponent);

export default SearchInput;
