import axios, { AxiosResponse } from "axios";
import React from "react";
import { render, waitForElement } from "react-testing-library";
import snapshotDiff from "snapshot-diff";

import Filter from "Filter";

const stubRequest = (
  query: string,
  response: Partial<AxiosResponse>,
  isFailure: boolean = false,
) => {
  jest.spyOn(axios, "get").mockImplementation((url: string) => {
    expect(url).toEqual(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`,
    );
    return isFailure ? Promise.reject(response) : Promise.resolve(response);
  });
};

const flushPromises = async () =>
  new Promise(resolve => process.nextTick(resolve));

describe("Filter", () => {
  const meals = [
    { idMeal: "123", strMeal: "Spicy Chicken" },
    {
      idMeal: "456",
      strMeal: "Rotisserie Chicken",
    },
  ];
  const data = { meals };
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.runAllTimers();
    await flushPromises();
  });

  describe("when created with a blank query string", () => {
    it("renders nothing", () => {
      const { container } = render(<Filter query={""} />);

      // Use a snapshot rather than asserting on number of child nodes - child
      // nodes may be empty and count as having rendered nothing but still throw
      // the test off
      expect(container).toMatchSnapshot();
    });
  });

  describe("when created with a query string", () => {
    const query = "chicken";

    it("displays a loading indicator", () => {
      const indicator = render(<Filter query={query} />).queryByTestId(
        "loading",
      );
      expect(indicator).not.toBeNull();
    });

    describe("when the API query is successful", () => {
      beforeEach(() => {
        stubRequest(query, { data, status: 200 });
      });

      it("renders the results", async () => {
        const { queryByText } = render(<Filter query={query} />);
        jest.runAllTimers();
        await flushPromises();

        // Use snapshot on first item to check it renders the right things, then
        // just check existence on remaining items (since they'd have to use the
        // same template)
        expect(queryByText(meals[0].strMeal)).toMatchSnapshot();
        expect(queryByText(meals[1].strMeal)).not.toBeNull();
      });

      describe("with no matches found", () => {
        it("shows a message indicating no results matched the query", async () => {
          // API returns `meals: null` rather than `meals: []` when no match found
          stubRequest(query, { data: { meals: null }, status: 200 });
          const { queryByText } = render(<Filter query={query} />);
          jest.runAllTimers();
          await flushPromises();

          expect(queryByText(query, { exact: false })).toMatchSnapshot();
        });
      });

      it("hides the loading indicator", async () => {
        const { queryByTestId } = render(<Filter query={query} />);
        jest.runAllTimers();
        await flushPromises();

        // Allow axios promise to resolve before asserting
        expect(queryByTestId("loading")).toBeNull();
      });
    });

    describe("when an error is encountered", () => {
      beforeEach(() => {
        stubRequest(query, { status: 404 }, true);
      });

      it("displays an error message", async () => {
        const { queryByText } = render(<Filter query={query} />);
        jest.runAllTimers();
        await flushPromises();

        expect(queryByText(/error/i)).toMatchSnapshot();
      });

      it("hides the loading indicator", async () => {
        const { queryByTestId } = render(<Filter query={query} />);
        jest.runAllTimers();
        await flushPromises();

        expect(queryByTestId("loading")).toBeNull();
      });
    });
  });

  describe("when the query string is updated", () => {
    const firstQuery = "chicken";
    const secondQuery = "pork";

    it("shows a loading indicator above the previous results", async () => {
      stubRequest(firstQuery, { data, status: 200 });
      const { asFragment, getByTestId, rerender } = render(
        <Filter query={firstQuery} />,
      );
      jest.runAllTimers();
      // Flush promises
      await flushPromises();
      const firstRender = asFragment();

      // Leave the second request hanging so that it doesn't resolve before
      // checking the loading indicator
      (axios.get as any).mockImplementation(() => new Promise(() => null));
      rerender(<Filter query={secondQuery} />);

      await waitForElement(() => getByTestId("loading"));
      expect(snapshotDiff(firstRender, asFragment())).toMatchSnapshot();
    });

    describe("with no matches found previously", () => {
      it("removes the 'no matches found' message", async () => {
        stubRequest(firstQuery, { data: { meals: null }, status: 200 });
        const { queryByText, rerender } = render(<Filter query={firstQuery} />);
        jest.runAllTimers();
        // Flush promises
        await flushPromises();
        // Avoid false positives
        expect(queryByText(firstQuery, { exact: false })).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the loading indicator
        (axios.get as any).mockImplementation(() => new Promise(() => null));
        rerender(<Filter query={secondQuery} />);

        expect(queryByText(firstQuery, { exact: false })).toBeNull();
        expect(queryByText(secondQuery, { exact: false })).toBeNull();
      });
    });

    describe("with a previous error", () => {
      it("hides the error message", async () => {
        stubRequest(firstQuery, { status: 404 }, true);
        const { getByTestId, queryByText, rerender } = render(
          <Filter query={firstQuery} />,
        );
        jest.runAllTimers();
        await flushPromises();
        expect(queryByText(/error/i)).not.toBeNull();

        // Leave the second request hanging so that it doesn't resolve before
        // checking the "loading" state
        (axios.get as any).mockImplementation(() => new Promise(() => null));
        rerender(<Filter query={secondQuery} />);

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
    const data2 = { meals: meals2 };

    it("debounces the request", () => {
      jest.useFakeTimers();

      stubRequest(firstQuery, { data, status: 200 });
      const { rerender } = render(<Filter query={firstQuery} />);

      stubRequest(secondQuery, { data: data2, status: 200 });
      rerender(<Filter query={secondQuery} />);

      // Time has not advanced, due to using jest.useFakeTimers, so the debounce
      // timeout has not been cleared, and no calls should have been made
      expect((axios.get as any).mock.calls.length).toBe(0);

      jest.advanceTimersByTime(500);
      expect((axios.get as any).mock.calls.length).toBe(1);
      // Also check that the last request is the one that got used
      expect((axios.get as any).mock.calls[0][0]).toEqual(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${secondQuery}`,
      );
    });
  });
});
