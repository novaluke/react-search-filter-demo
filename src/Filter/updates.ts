import { Meal } from "./reducer";

export enum UpdateTag {
  FETCH_START = "FETCH_START",
  FETCH_SUCCESS = "FETCH_SUCCESS",
  FETCH_FAIL = "FETCH_FAIL",
  RESET = "RESET",
}

export type Update =
  | { type: UpdateTag.FETCH_START }
  | { type: UpdateTag.FETCH_SUCCESS; payload: Meal[] }
  | { type: UpdateTag.FETCH_FAIL }
  | { type: UpdateTag.RESET };

export const fetchStart = (): Update => ({
  type: UpdateTag.FETCH_START,
});

export const fetchSuccess = (meals: Meal[]): Update => ({
  payload: meals,
  type: UpdateTag.FETCH_SUCCESS,
});

export const fetchFail = (): Update => ({ type: UpdateTag.FETCH_FAIL });

export const reset = (): Update => ({ type: UpdateTag.RESET });
