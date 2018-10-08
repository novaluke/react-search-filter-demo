import React from "react";
import { FaSpinner } from "react-icons/fa";
import { combineLatest, merge, Observable } from "rxjs";
import { debounceTime, map, mapTo, partition, switchMap } from "rxjs/operators";

import { componentFromStream, mergeStates } from "../streamHelpers";
import { fetchResults, Props, State, whenQueryChanges } from "./operators";

const Filter = componentFromStream((props$: Observable<Props>) => {
  const initialState: State = {
    hasError: false,
    loading: false,
    results: [],
  };
  // Split a stream in two based on values that pass or fail the predicate
  // function. Helps to ensure you've covered all cases, compared to defining
  // the two streams separately. The strange syntax is due to an idosyncracity
  // in the types of `partition` (https://github.com/ReactiveX/rxjs/issues/2995)
  const [newQueries$, queryReset$] = partition<string>(
    // `query => query` would be more concise, but this is better for
    // readability/comprehensibility (elegance of expression doesn't lead to
    // better real-world value, but maintainability and extensibility sure do).
    query => query.length > 0,
  )(props$.pipe(whenQueryChanges));
  const state$ = merge(
    queryReset$.pipe(mapTo({ hasError: false, loading: false, results: [] })),
    // It may seem strange that the stream that emits the loading state is
    // separate from - and operates independently to - the stream that actually
    // does the loading. However, the request is debounced, and we don't want to
    // wait until the request is actually kicked off to let the user know we've
    // received their request and are working on it - that would give the user
    // the incorrect indication that nothing is happening despite their input.
    // So the decision to show a loading indicator is actually based off of
    // *user input* rather than *application action*, and therefore it makes
    // sense for it to operate independtly of the request triggering. In this
    // case, having to program in streams guides the developer into developing
    // proper coupling.
    newQueries$.pipe(mapTo({ hasError: false, loading: true })),
    newQueries$.pipe(
      debounceTime(500),
      // Run the fetch function, which returns a stream, and only use the latest
      // stream to be created, cancelling the previous one (and thus cancelling
      // its XHR). Note: point free notation could be used here, but again,
      // being explicit helps with readability/comprehensibility.
      switchMap(query => fetchResults(query)),
    ),
  ).pipe(mergeStates(initialState));

  return combineLatest(props$, state$).pipe(
    map(([{ query }, { hasError, loading, results }]) => (
      <div>
        {hasError ? <span>An error occurred</span> : null}
        {loading ? <FaSpinner data-testid="loading" /> : null}
        {results.length === 0 && query && !loading && !hasError ? (
          <span>No results found for "{query}"</span>
        ) : (
          results.map(result => <div key={result.idMeal}>{result.strMeal}</div>)
        )}
      </div>
    )),
  );
});

export default Filter;
