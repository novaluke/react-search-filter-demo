import { scan } from "rxjs/operators";

import { AsyncValue, AsyncValueTag, error, loading, success } from "async";

import { Update, UpdateTag } from "./updates";

export type State = AsyncValue<Meal[]>;

export interface Meal {
  idMeal: string;
  strMeal: string;
}

// Convenience function for pulling results out of an AsyncValue, or returning
// null if it was of a type that has no value (or if the results were null).
const valueOrNull = <T>(asyncValue: AsyncValue<T>) => {
  switch (asyncValue.state) {
    case AsyncValueTag.LOADING:
    case AsyncValueTag.SUCCESS:
      return asyncValue.results;
    default:
      return null;
  }
};

export const reducer = (initialState: State) =>
  scan((state: State, update: Update) => {
    switch (update.type) {
      case UpdateTag.FETCH_START:
        return loading(valueOrNull(state));
      case UpdateTag.FETCH_SUCCESS:
        return success(update.payload);
      case UpdateTag.FETCH_FAIL:
        return error() as State;
      case UpdateTag.RESET:
        return initialState;
    }
  }, initialState);
