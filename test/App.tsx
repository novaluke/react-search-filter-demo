jest.mock("AsyncList", () => ({
  AsyncList: jest.fn(),
  createQueryHandler: jest.fn(),
}));

import React from "react";
import { fireEvent, render } from "react-testing-library";
import { Subject } from "rxjs";

import App from "App";
import { AsyncList, AsyncListProps, createQueryHandler } from "AsyncList";
import { init, success } from "common/async";

describe("App component", () => {
  const listProps = (key: keyof AsyncListProps) => {
    const calls = (AsyncList as any).mock.calls;
    return calls[calls.length - 1][0][key];
  };
  const handler = jest.fn();
  let results$: Subject<any>;
  beforeEach(() => {
    (AsyncList as any).mockImplementation(() => "AsyncList");
    results$ = new Subject();
    (createQueryHandler as any).mockImplementation(() => ({
      handler,
      results$,
    }));
  });

  it("sets AsyncList's results to the init state", () => {
    render(<App />);
    expect(listProps("results")).toEqual(init());
  });

  describe("when the input value is changed", () => {
    it("updates the noResultsComponent on AsyncList", () => {
      const input = render(<App />).container.querySelector("input")!;

      fireEvent.change(input, { target: { value: "foo" } });

      expect(listProps("noResultsComponent")).toMatchSnapshot();
    });

    it("initiates a request for the given query string", () => {
      const input = render(<App />).container.querySelector("input")!;
      const query = "foo";
      const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;

      fireEvent.change(input, { target: { value: "foo" } });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(url);
    });

    describe("when createQueryHandler emits", () => {
      const results = success(["chicken"]);

      it("passes the extracted results to AsyncList", () => {
        render(<App />);

        expect(listProps("results")).not.toEqual(results);
        results$.next(results);

        expect(listProps("results")).toEqual(results);
      });
    });

    describe("when the value is cleared", () => {
      it("resets the results for AsyncList back to the init state", () => {
        const expected = init();
        const input = render(<App />).container.querySelector("input")!;

        // Must ensure that the input has text, or else setting it to empty
        // doesn't result in a change
        fireEvent.change(input, { target: { value: "bar" } });
        // Must also ensure that the results have been changed, since we've
        // stubbed out the mechanism that would do so based on query change
        results$.next(success([]));
        expect(listProps("results")).not.toEqual(expected);

        fireEvent.change(input, { target: { value: "" } });

        expect(listProps("results")).toEqual(expected);
      });
    });
  });

  // Ideally we'd test that the render and errorComponent on AsyncList are set
  // properly, and maybe use snapshot testing to check the overall
  // layout/styling, but that's currently omitted in the interest of time
});
