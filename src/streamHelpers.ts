import { componentFromStreamWithConfig } from "recompose";
import { from, Observable } from "rxjs";
import { scan } from "rxjs/operators";

// `Mapper` and `componentFromStream` are needed because the typings for
// recompose are currently incorrect
type Mapper<T> = (input: Observable<T>) => Observable<React.ReactNode>;

export const componentFromStream: <T>(
  fn: Mapper<T>,
) => React.ComponentType<T> = fn =>
  componentFromStreamWithConfig({
    fromESObservable: from as any,
    toESObservable: x => x,
  })(fn as any);

// Can be used as a `pipe` operator
export const mergeStates = <State>(initialState: State) =>
  scan<Partial<State>, State>(
    // Have to use Object.assign because spread in TypeScript doesn't work with
    // generic types
    (state: State, update: Partial<State>) => Object.assign({}, state, update),
    initialState,
  );
