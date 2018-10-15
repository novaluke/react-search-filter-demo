import React from "react";
import { render } from "react-testing-library";

import { error, init, loading, success } from "common/async";

import { AsyncList, AsyncListProps as Props, Meal } from "AsyncList";

describe("AsyncList", () => {
  const renderFn = jest.fn();
  const errText = "This is an error message";
  const errorComponent = <span>{errText}</span>;
  const noResultsText = "No results found";
  const noResultsComponent = <span>{noResultsText}</span>;
  const defaultProps: Props = {
    errorComponent,
    noResultsComponent,
    render: renderFn,
    results: init(),
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

  describe("when results are in the initial state", () => {
    it("renders nothing", () => {
      const { container } = render(component());

      expect(renderFn).not.toHaveBeenCalled();
      // Use a snapshot rather than asserting on number of child nodes - child
      // nodes may be empty and count as having rendered nothing but still throw
      // the test off
      expect(container).toMatchSnapshot();
    });
  });

  describe("when results are loading", () => {
    it("displays a loading indicator", () => {
      const results = loading<Meal[]>(null);
      const indicator = render(component({ results })).queryByTestId("loading");

      expect(indicator).not.toBeNull();
    });

    describe("with previous results available", () => {
      it("shows the previous results", () => {
        const results = loading(meals);
        render(component({ results }));

        expect(renderFn).toBeCalledTimes(2);
        expect(renderFn.mock.calls[0][0]).toEqual(meals[0]);
        expect(renderFn.mock.calls[1][0]).toEqual(meals[1]);
      });

      it("places the loading indicator above the previous results", () => {
        renderFn.mockImplementation(() => (
          <h1 key={Math.random()}>Previous results</h1>
        ));
        const results = loading(meals);
        const { container } = render(component({ results }));

        expect(container).toMatchSnapshot();
      });
    });
  });

  describe("when successful", () => {
    it("doesn't show the loading indicator", () => {
      const results = success([]);
      const indicator = render(component({ results })).queryByTestId("loading");

      expect(indicator).toBeNull();
    });

    it("doesn't show the errorComponent", () => {
      const results = success([]);
      const { queryByText } = render(component({ results }));

      expect(queryByText(errText)).toBeNull();
    });

    describe("with no results found", () => {
      it("renders the noResultsComponent", () => {
        const results = success([]);
        const { queryByText } = render(component({ results }));

        expect(queryByText(noResultsText)).not.toBeNull();
      });
    });

    describe("with results found", () => {
      it("doesn't render the noResultsComponent", () => {
        const results = success(meals);
        const { queryByText } = render(component({ results }));

        expect(queryByText(noResultsText)).toBeNull();
      });

      it("renders the results", () => {
        const results = success(meals);
        render(component({ results }));

        expect(renderFn).toBeCalledTimes(2);
        expect(renderFn.mock.calls[0][0]).toEqual(meals[0]);
        expect(renderFn.mock.calls[1][0]).toEqual(meals[1]);
      });
    });
  });

  describe("with an error", () => {
    it("renders the errorComponent", () => {
      const results = error<Meal[]>();
      const { queryByText } = render(component({ results }));

      expect(queryByText(errText)).not.toBeNull();
    });

    it("doesn't render the noResultsComponent", () => {
      const results = error<Meal[]>();
      const { queryByText } = render(component({ results }));

      expect(queryByText(noResultsText)).toBeNull();
    });

    it("doesn't show the loading indicator", () => {
      const results = error<Meal[]>();
      const { queryByTestId } = render(component({ results }));

      expect(queryByTestId("loading")).toBeNull();
    });
  });
});
