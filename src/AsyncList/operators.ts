import { Observable, of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { catchError, distinctUntilChanged, map, pluck } from "rxjs/operators";

import { AsyncValue } from "async";

import { fetchFail, fetchSuccess, Update } from "./updates";

export interface Props {
  query: string;
  render: React.SFC<Meal>;
}

export type State = AsyncValue<Meal[]>;

export interface Meal {
  idMeal: string; // id
  strMeal: string; // Name
}

const url = (query: string) =>
  `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;

export const fetchResults = (query: string): Observable<Update> =>
  ajax.getJSON(url(query)).pipe(
    map((response: any) => fetchSuccess(response.meals || [])),
    catchError(() => of(fetchFail())),
  );

// Can be used as a `pipe` operator
export const whenQueryChanges = (
  props$: Observable<Props>,
): Observable<string> =>
  props$.pipe(
    pluck<Props, Props["query"]>("query"), // extract the `query` property
    distinctUntilChanged(), // filter out consecutive duplicates
  );
