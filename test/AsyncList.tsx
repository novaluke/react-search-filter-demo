import React from "react";
import { render, waitForElement } from "react-testing-library";
import { never, of, throwError } from "rxjs";
import { ajax } from "rxjs/ajax";
import snapshotDiff from "snapshot-diff";

import { AsyncList } from "AsyncList";
import { Meal } from "AsyncList/operators";

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
      const { container } = render(<AsyncList query={""} />);

      // Use a snapshot rather than asserting on number of child nodes - child
      // nodes may be empty and count as having rendered nothing but still throw
      // the test off
      expect(container).toMatchSnapshot();
    });
  });

  describe("when created with a query string", () => {
    const query = "chicken";

    it("displays a loading indicator", () => {
      const indicator = render(<AsyncList query={query} />).queryByTestId(
        "loading",
      );
      expect(indicator).not.toBeNull();
    });

    describe("when the API query is successful", () => {
      beforeEach(() => {
        stubRequest(query, meals);
      });

      it("renders the results", () => {
        const { queryByText } = render(<AsyncList query={query} />);
        jest.runAllTimers();

        // Use snapshot on first item to check it renders the right things, then
        // just check existence on remaining items (since they'd have to use the
        // same template)
        expect(queryByText(meals[0].strMeal)).toMatchSnapshot();
        expect(queryByText(meals[1].strMeal)).not.toBeNull();
      });

      describe("with no matches found", () => {
        it("shows a message indicating no results matched the query", () => {
          // API returns `meals: null` rather than `meals: []` when no match found
          stubRequest(query, null);
          const { queryByText } = render(<AsyncList query={query} />);
          jest.runAllTimers();

          expect(queryByText(query, { exact: false })).toMatchSnapshot();
        });
      });

      it("hides the loading indicator", () => {
        const { queryByTestId } = render(<AsyncList query={query} />);
        jest.runAllTimers();

        // Allow axios promise to resolve before asserting
        expect(queryByTestId("loading")).toBeNull();
      });
    });

    describe("when an error is encountered", () => {
      beforeEach(() => {
        stubRequest(query, new Error("Mocked XHR error"));
      });

      it("displays an error message", () => {
        const { queryByText } = render(<AsyncList query={query} />);
        jest.runAllTimers();

        expect(queryByText(/error/i)).toMatchSnapshot();
      });

      it("hides the loading indicator", () => {
        const { queryByTestId } = render(<AsyncList query={query} />);
        jest.runAllTimers();

        expect(queryByTestId("loading")).toBeNull();
      });

      it("doesn't display the 'no results' message", () => {
        const { queryByText } = render(<AsyncList query={query} />);
        jest.runAllTimers();

        expect(queryByText(query, { exact: false })).toBeNull();
      });
    });
  });

  describe("when the query string is updated", () => {
    const firstQuery = "chicken";
    const secondQuery = "pork";

    it("shows a loading indicator above the previous results", async () => {
      stubRequest(firstQuery, meals);
      const { asFragment, getByTestId, rerender } = render(
        <AsyncList query={firstQuery} />,
      );
      jest.runAllTimers();
      const firstRender = asFragment();

      // Leave the second request hanging so that it doesn't resolve before
      // checking the loading indicator
      (ajax.getJSON as any).mockImplementation(() => never());
      rerender(<AsyncList query={secondQuery} />);

      await waitForElement(() => getByTestId("loading"));
      expect(snapshotDiff(firstRender, asFragment())).toMatchSnapshot();
    });

    describe("with no matches found previously", () => {
      it("removes the 'no matches found' message", () => {
        stubRequest(firstQuery, null);
        const { queryByText, rerender } = render(
          <AsyncList query={firstQuery} />,
        );
        jest.runAllTimers();
        // Avoid false positives
        expect(queryByText(firstQuery, { exact: false })).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the loading indicator
        (ajax.getJSON as any).mockImplementation(() => never());
        rerender(<AsyncList query={secondQuery} />);

        expect(queryByText(firstQuery, { exact: false })).toBeNull();
        expect(queryByText(secondQuery, { exact: false })).toBeNull();
      });
    });

    describe("with a previous error", () => {
      it("hides the error message", async () => {
        stubRequest(firstQuery, new Error("Mocked XHR error"));
        const { getByTestId, queryByText, rerender } = render(
          <AsyncList query={firstQuery} />,
        );
        jest.runAllTimers();
        expect(queryByText(/error/i)).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the "loading" state
        (ajax.getJSON as any).mockImplementation(() => never());
        rerender(<AsyncList query={secondQuery} />);

        await waitForElement(() => getByTestId("loading"));
        expect(queryByText(/error/i)).toBeNull();
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
      const { rerender } = render(<AsyncList query={firstQuery} />);

      stubRequest(secondQuery, meals2);
      rerender(<AsyncList query={secondQuery} />);

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
