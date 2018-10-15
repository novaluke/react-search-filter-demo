import React from "react";
import { FaSpinner } from "react-icons/fa";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { AsyncValue, caseOf } from "common/async";
import { componentFromStream } from "common/streamHelpers";

export interface Props {
  results: AsyncValue<Meal[]>;
  render: React.SFC<Meal>;
  errorComponent: JSX.Element;
  noResultsComponent: JSX.Element;
}

export interface Meal {
  idMeal: string; // id
  strMeal: string; // Name
}

const renderItems = (items: Meal[] | null, render: React.SFC<Meal>) => {
  if (items === null) {
    return null;
  }
  return items.map(render);
};

const AsyncList = componentFromStream((props$: Observable<Props>) => {
  return props$.pipe(
    map(({ results, render, errorComponent, noResultsComponent }) =>
      caseOf(results, {
        // TODO pass the error in so errorComponent can provide useful contextual info
        error: () => errorComponent,
        init: () => null,
        loading: items => (
          <div>
            <FaSpinner data-testid="loading" />
            {renderItems(items, render)}
          </div>
        ),
        success: items =>
          items.length > 0 ? renderItems(items, render) : noResultsComponent,
      }),
    ),
  );
});

export default AsyncList;
