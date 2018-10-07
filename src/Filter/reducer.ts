import { Action } from "./actions";

export interface State {
  hasError: boolean;
  loading: boolean;
  results: any[];
}

export interface Meal {
  idMeal: string;
  strMeal: string;
}

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "FETCH_RESULTS":
      return { ...state, hasError: false, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        hasError: false,
        loading: false,
        results: action.payload,
      };
    case "FETCH_FAIL":
      return {
        ...state,
        hasError: true,
        loading: false,
      };
  }
};
