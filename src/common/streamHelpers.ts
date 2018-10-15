import {
  ComponentEnhancer,
  componentFromStreamWithConfig,
  createEventHandlerWithConfig,
  EventHandlerOf,
  mapPropsStreamWithConfig,
  ObservableConfig,
} from "recompose";
import { from, Observable } from "rxjs";
import { scan } from "rxjs/operators";

const config: ObservableConfig = {
  fromESObservable: from as any,
  toESObservable: x => x,
};

// `Mapper` and `componentFromStream` are needed because the typings for
// recompose are currently incorrect
type Mapper<T> = (input: Observable<T>) => Observable<React.ReactNode>;

export const componentFromStream: <T>(
  fn: Mapper<T>,
) => React.ComponentType<T> = fn =>
  componentFromStreamWithConfig(config)(fn as any);

export const createEventHandler: <T>() => EventHandlerOf<
  T,
  Observable<T>
> = createEventHandlerWithConfig(config);

export const mapPropsStream: <TInner, TOutter>(
  transform: (input: Observable<TInner>) => Observable<TOutter>,
) => ComponentEnhancer<TInner, TOutter> = mapPropsStreamWithConfig(
  config,
) as any; // Types are incorrect, so force it to accept our definitions

// Can be used as a `pipe` operator
export const mergeStates = <State>(initialState: State) =>
  scan<Partial<State>, State>(
    // Have to use Object.assign because spread in TypeScript doesn't work with
    // generic types
    (state: State, update: Partial<State>) => Object.assign({}, state, update),
    initialState,
  );
