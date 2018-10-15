import { merge, Observable, of, Subject } from "rxjs";
import { ajax } from "rxjs/ajax";
import {
  catchError,
  debounceTime,
  map,
  share,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs/operators";

import {
  AsyncValue,
  AsyncValueTag,
  error,
  init,
  loading,
  success,
} from "common/async";

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

type Transform<T> = (data: any) => T;

const fetchResults = <T>(
  url: string,
  transform: Transform<T>,
): Observable<AsyncValue<any>> =>
  ajax.getJSON(url).pipe(
    map((response: any) => success(transform(response))),
    catchError(() => of(error<any>())),
  );

const createQueryHandler = <T>(transform: Transform<T>) => {
  const subject = new Subject<string>();

  // results$ needs to be shared or else it will be a cold observable - which
  // means that when loading$ subscribes to it (in addition to it being
  // subscribed to when merged into the output stream) it will run through its
  // pipeline again, causing another ajax request
  const results$ = subject.pipe(
    debounceTime(500), // TODO make time length configurable
    switchMap(url => fetchResults(url, transform)),
    share(),
  );

  const loading$ = subject.pipe(
    withLatestFrom(results$.pipe(startWith(init()))),
    map(([_, results]) => loading(valueOrNull(results))),
  );

  return {
    handler: subject.next.bind(subject),
    results$: merge(loading$, results$),
  };
};

export default createQueryHandler;
