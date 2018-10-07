import { Observable, of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { catchError, distinctUntilChanged, map, pluck } from "rxjs/operators";

export interface Props {
  query: string;
}

export interface State {
  hasError: boolean;
  loading: boolean;
  results: Meal[];
}

export interface Meal {
  idMeal: string; // id
  strMeal: string; // Name
}

const url = (query: string) =>
  `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;

export const fetchResults = (query: string) =>
  ajax.getJSON(url(query)).pipe(
    map((response: any) => ({
      hasError: false,
      loading: false,
      results: response.meals || [],
    })),
    catchError(() => of({ hasError: true, loading: false })),
  );

// Can be used as a `pipe` operator
export const whenQueryChanges = (
  props$: Observable<Props>,
): Observable<string> =>
  props$.pipe(
    pluck<Props, Props["query"]>("query"), // extract the `query` property
    distinctUntilChanged(), // filter out consecutive duplicates
  );
