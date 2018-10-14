import React from "react";
import { render, waitForElement } from "react-testing-library";
import { never, of, throwError } from "rxjs";
import { ajax } from "rxjs/ajax";
import snapshotDiff from "snapshot-diff";

import { AsyncList } from "AsyncList";
import { Meal, Props } from "AsyncList/operators";

const stubRequest = (query: string, resultsOrError: Meal[] | null | Error) => {
  jest.spyOn(ajax, "getJSON").mockImplementation((url: string) => {
    expect(url).toEqual(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`,
    );
    return resultsOrError instanceof Error
      ? throwError(resultsOrError)
      : of({ meals: resultsOrError });
  });
};

describe("AsyncList", () => {
  const renderFn = jest.fn();
  const errText = "This is an error message";
  const errorComponent = <span>{errText}</span>;
  const noResultsText = "No results found";
  const noResultsComponent = <span>{noResultsText}</span>;
  const defaultProps: Props = {
    errorComponent,
    noResultsComponent,
    query: "",
    render: renderFn,
  };
  const component = (props: Partial<Props> = {}) => (
    <AsyncList {...defaultProps} {...props} />
  );
  const meals = [
    { idMeal: "123", strMeal: "Spicy Chicken" },
    {
      idMeal: "456",
      strMeal: "Rotisserie Chicken",
    },
  ];
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runAllTimers();
  });

  describe("when created with a blank query string", () => {
    it("renders nothing", () => {
      const { container } = render(component());

      expect(renderFn).not.toHaveBeenCalled();
      // Use a snapshot rather than asserting on number of child nodes - child
      // nodes may be empty and count as having rendered nothing but still throw
      // the test off
      expect(container).toMatchSnapshot();
    });
  });

  describe("when created with a query string", () => {
    const query = "chicken";

    it("displays a loading indicator", () => {
      const indicator = render(component({ query })).queryByTestId("loading");
      expect(indicator).not.toBeNull();
    });

    describe("when the API query is successful", () => {
      beforeEach(() => {
        stubRequest(query, meals);
      });

      it("renders the results", () => {
        render(component({ query }));
        jest.runAllTimers();

        expect(renderFn).toHaveBeenCalledTimes(2);
        expect(renderFn.mock.calls[0][0]).toEqual(meals[0]);
        expect(renderFn.mock.calls[1][0]).toEqual(meals[1]);
      });

      describe("with no matches found", () => {
        it("renders the noResultsComponent", () => {
          // API returns `meals: null` rather than `meals: []` when no match found
          stubRequest(query, null);
          const { queryByText } = render(component({ query }));
          jest.runAllTimers();

          expect(queryByText(noResultsText)).not.toBeNull();
        });
      });

      it("hides the loading indicator", () => {
        const { queryByTestId } = render(component({ query }));
        jest.runAllTimers();

        // Allow axios promise to resolve before asserting
        expect(queryByTestId("loading")).toBeNull();
      });
    });

    describe("when an error is encountered", () => {
      beforeEach(() => {
        stubRequest(query, new Error("Mocked XHR error"));
      });

      it("renders the errorComponent prop", () => {
        const { queryByText } = render(component({ query }));
        jest.runAllTimers();

        expect(queryByText(errText)).not.toBeNull();
      });

      it("hides the loading indicator", () => {
        const { queryByTestId } = render(component({ query }));
        jest.runAllTimers();

        expect(queryByTestId("loading")).toBeNull();
      });

      it("doesn't display the 'no results' message", () => {
        const { queryByText } = render(component({ query }));
        jest.runAllTimers();

        expect(queryByText(query, { exact: false })).toBeNull();
      });
    });
  });

  describe("when the query string is updated", () => {
    const firstQuery = "chicken";
    const secondQuery = "pork";

    it("shows a loading indicator above the previous results", async () => {
      renderFn.mockImplementation(() => (
        <h1 key={Math.random()}>Previous results</h1>
      ));
      stubRequest(firstQuery, meals);
      const { asFragment, getByTestId, rerender } = render(
        component({ query: firstQuery }),
      );
      jest.runAllTimers();
      const firstRender = asFragment();

      // Leave the second request hanging so that it doesn't resolve before
      // checking the loading indicator
      (ajax.getJSON as any).mockImplementation(() => never());
      rerender(component({ query: secondQuery }));

      await waitForElement(() => getByTestId("loading"));
      expect(snapshotDiff(firstRender, asFragment())).toMatchSnapshot();
    });

    describe("with no matches found previously", () => {
      it("removes the 'no matches found' message", () => {
        stubRequest(firstQuery, null);
        const { queryByText, rerender } = render(
          component({ query: firstQuery }),
        );
        jest.runAllTimers();
        // Avoid false positives
        expect(queryByText(noResultsText)).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the loading indicator
        (ajax.getJSON as any).mockImplementation(() => never());
        rerender(component({ query: secondQuery }));

        expect(queryByText(noResultsText)).toBeNull();
      });
    });

    describe("with a previous error", () => {
      it("hides the error message", async () => {
        stubRequest(firstQuery, new Error("Mocked XHR error"));
        const { getByTestId, queryByText, rerender } = render(
          component({ query: firstQuery }),
        );
        jest.runAllTimers();
        expect(queryByText(errText)).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the "loading" state
        (ajax.getJSON as any).mockImplementation(() => never());
        rerender(component({ query: secondQuery }));

        await waitForElement(() => getByTestId("loading"));
        expect(queryByText(errText)).toBeNull();
      });
    });
  });

  describe("when query changes rapidly", () => {
    const firstQuery = "chicken";
    const secondQuery = "pork";
    const meals2 = [
      { idMeal: "1000", strMeal: "Pulled Pork" },
      {
        idMeal: "1001",
        strMeal: "Pork chop",
      },
    ];

    it("debounces the request", () => {
      stubRequest(firstQuery, meals);
      const { rerender } = render(component({ query: firstQuery }));

      stubRequest(secondQuery, meals2);
      rerender(component({ query: secondQuery }));

      // Time has not advanced, due to using jest.useFakeTimers, so the debounce
      // timeout has not been cleared, and no calls should have been made
      expect((ajax.getJSON as any).mock.calls.length).toBe(0);

      jest.advanceTimersByTime(500);
      expect((ajax.getJSON as any).mock.calls.length).toBe(1);
      // Also check that the last request is the one that got used
      expect((ajax.getJSON as any).mock.calls[0][0]).toEqual(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${secondQuery}`,
      );
    });
  });
});
