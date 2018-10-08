import React from "react";
import { FaSpinner } from "react-icons/fa";
import { combineLatest, merge, Observable } from "rxjs";
import { debounceTime, map, mapTo, partition, switchMap } from "rxjs/operators";

import { AsyncValueTag, init } from "async";
import { componentFromStream } from "../streamHelpers";
import {
  fetchResults,
  Meal,
  Props,
  State,
  whenQueryChanges,
} from "./operators";
import { reducer } from "./reducer";
import { fetchStart, reset } from "./updates";

const renderResults = (results: Meal[] | null) => {
  if (results === null) {
    return null;
  }
  return results.map(result => <div key={result.idMeal}>{result.strMeal}</div>);
};

const Filter = componentFromStream((props$: Observable<Props>) => {
  const initialState: State = init();
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
    queryReset$.pipe(mapTo(reset())),
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
    newQueries$.pipe(mapTo(fetchStart())), // TODO rename to be about query not AJAX
    newQueries$.pipe(
      debounceTime(500),
      // Run the fetch function, which returns a stream, and only use the latest
      // stream to be created, cancelling the previous one (and thus cancelling
      // its XHR). Note: point free notation could be used here, but again,
      // being explicit helps with readability/comprehensibility.
      switchMap(query => fetchResults(query)),
    ),
  ).pipe(reducer(initialState));

  return combineLatest(props$, state$).pipe(
    map(([{ query }, results]) => (
      <div>
        {results.state === AsyncValueTag.ERROR && (
          <span>An error occurred</span>
        )}
        {results.state === AsyncValueTag.LOADING && (
          <FaSpinner data-testid="loading" />
        )}
        {results.state === AsyncValueTag.SUCCESS &&
          results.results.length === 0 && (
            <span>No results found for "{query}"</span>
          )}
        {(results.state === AsyncValueTag.SUCCESS ||
          results.state === AsyncValueTag.LOADING) &&
          renderResults(results.results)}
      </div>
    )),
  );
});

export default Filter;
