import React from "react";
import { FaSpinner } from "react-icons/fa";
import { combineLatest, merge, Observable } from "rxjs";
import { debounceTime, filter, map, switchMap } from "rxjs/operators";

import { componentFromStream, mergeStates } from "../streamHelpers";
import { fetchResults, Props, State, whenQueryChanges } from "./operators";

const Filter = componentFromStream((props$: Observable<Props>) => {
  const initialState: State = {
    hasError: false,
    loading: false,
    results: [],
  };
  const state$ = merge(
    // The streams are structured such that state updates are return values from
    // the stream. Since the XHR stream requires debouncing, we can't just throw
    // the loading state update on the front of it, or it will be debounced as
    // well. Instead, we emit it in a parallel stream. Note: although it may
    // seeem like all prop changes are being mapped to the loading state, that's
    // not actually the case. The props stream has been filtered down to a
    // specific segment, so only changes to that segment are being mapped, and
    // it's then recombined with the streams that update based on other
    // segments, to form a complete picture in the end.
    props$.pipe(
      whenQueryChanges,
      map(query => {
        const loading = { hasError: false, loading: true };
        const blank = { hasError: false, loading: false, results: [] };
        return query ? loading : blank;
      }),
    ),
    props$.pipe(
      whenQueryChanges,
      // Only fetch when query is not blank (though for some use cases a blank
      // query might be allowable - ideally Filter would take a flag for that).
      // `query => !!query` would be more concise, but this is better for
      // readability/comprehensibility.
      filter(query => query.length > 0),
      debounceTime(500),
      // Run the fetch function, which returns a stream, and only use the latest
      // stream to be created, cancelling the previous one (and thus cancelling
      // its XHR). Note: point free notation could be used here, but being
      // explicit helps with readability/comprehensibility.
      switchMap(query => fetchResults(query)),
    ),
  ).pipe(mergeStates(initialState));

  return combineLatest(props$, state$).pipe(
    map(([{ query }, { hasError, loading, results }]) => (
      <div>
        {hasError ? <span>An error occurred</span> : null}
        {loading ? <FaSpinner data-testid="loading" /> : null}
        {results.length === 0 && query && !loading ? (
          <span>No results found for "{query}"</span>
        ) : (
          results.map(result => <div key={result.idMeal}>{result.strMeal}</div>)
        )}
      </div>
    )),
  );
});

export default Filter;
