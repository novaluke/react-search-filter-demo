import axios from "axios";
import { Meal } from "./reducer";

export type Action =
  | { type: "FETCH_RESULTS" }
  | {
      type: "FETCH_SUCCESS";
      payload: Meal[];
    }
  | { type: "FETCH_FAIL" };

type Dispatch = (action: Action) => void;

// Convenience functions for creating action data objects. By specifying the
// return type to be Action (or the input to be Dispatch) we can make sure we
// never create an action with a that doesn't exist, which would lead to it
// being silently ignored by the reducer.
let fetchResultsTimer: ReturnType<typeof setTimeout> | null = null;
export const fetchResults = (url: string, dispatch: Dispatch) => {
  dispatch({ type: "FETCH_RESULTS" });
  if (fetchResultsTimer !== null) clearTimeout(fetchResultsTimer);
  fetchResultsTimer = setTimeout(
    () =>
      axios
        .get(url)
        .then(response => dispatch(fetchSuccess(response.data.meals || [])))
        .catch(_ => dispatch(fetchFail())),
    500,
  );
};

export const fetchSuccess = (meals: Meal[]): Action => ({
  payload: meals,
  type: "FETCH_SUCCESS",
});

export const fetchFail = (): Action => ({ type: "FETCH_FAIL" });
