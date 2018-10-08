import { Observable, of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { catchError, distinctUntilChanged, map, pluck } from "rxjs/operators";

import { AsyncValue, error, success } from "async";

export interface Props {
  query: string;
}

export type State = AsyncValue<Meal[]>;

export interface Meal {
  idMeal: string; // id
  strMeal: string; // Name
}

const url = (query: string) =>
  `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;

export const fetchResults = (query: string): Observable<State> =>
  ajax.getJSON(url(query)).pipe(
    map((response: any) => success(response.meals || [])),
    catchError(() => of(error() as State)),
  );

// Can be used as a `pipe` operator
export const whenQueryChanges = (
  props$: Observable<Props>,
): Observable<string> =>
  props$.pipe(
    pluck<Props, Props["query"]>("query"), // extract the `query` property
    distinctUntilChanged(), // filter out consecutive duplicates
  );
