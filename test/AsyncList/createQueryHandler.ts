import { empty, of, throwError } from "rxjs";
import { ajax } from "rxjs/ajax";
import { take, toArray } from "rxjs/operators";

import { error, loading, success } from "common/async";

import { createQueryHandler } from "AsyncList";

const stubRequest = <T>(
  expectedUrl: string,
  resultsOrError: T | null | Error,
) => {
  jest.spyOn(ajax, "getJSON").mockImplementation((actualUrl: string) => {
    expect(actualUrl).toEqual(expectedUrl);
    return resultsOrError instanceof Error
      ? throwError(resultsOrError)
      : of(resultsOrError);
  });
};

describe("createQueryHandler", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("emits nothing at first", () => {
    const handler = jest.fn();
    const { results$ } = createQueryHandler(jest.fn());

    results$.subscribe(handler);

    jest.runAllTimers();
    expect(handler).not.toHaveBeenCalled();
  });

  describe("when `handler` is called", () => {
    it("emits a loading value immediately", async () => {
      const { handler, results$ } = createQueryHandler(jest.fn());
      const results = results$
        .pipe(
          take(1),
          toArray(),
        )
        .toPromise();

      handler("foo");

      jest.runAllTimers();
      expect(await results).toEqual([loading(null)]);
    });

    it("debounces ajax requests to the given url", () => {
      jest.spyOn(ajax, "getJSON").mockImplementation(() => empty());
      const { handler, results$ } = createQueryHandler(jest.fn());
      // Force lazy stream to evaluate
      results$.subscribe(jest.fn());

      // Check that it doesn't dispatch any requests within the time window
      // (debounce time minus 1)
      handler("foo");
      handler("bar");
      jest.advanceTimersByTime(499);
      expect(ajax.getJSON).not.toHaveBeenCalled();

      // Check that it dispatches the last request once the debounce time is reached
      jest.advanceTimersByTime(1);
      expect(ajax.getJSON).toHaveBeenCalledTimes(1);
      expect(ajax.getJSON).toHaveBeenCalledWith("bar");
    });

    describe("when data fetching is successful", () => {
      const data = [1, 2, 3];
      const url = "foo";
      beforeEach(() => {
        stubRequest(url, data);
      });

      it("emits a success value with the result transformed by the transform arg", async () => {
        const transform = () => ({ key: "value" });
        const { handler, results$ } = createQueryHandler(transform);
        const results = results$
          .pipe(
            take(2), // loading, success
            toArray(),
          )
          .toPromise();

        handler(url);

        jest.runAllTimers();
        expect((await results)[1]).toEqual(success(transform()));
      });

      describe("when `next` is called again", () => {
        it("adds the previous results to the loading value", async () => {
          const transform = () => ({ key: "value" });
          const { handler, results$ } = createQueryHandler(transform);
          const results = results$
            .pipe(
              take(3), // loading, success, loading
              toArray(),
            )
            .toPromise();

          handler(url);
          jest.runAllTimers();

          handler(url);
          expect((await results)[2]).toEqual(loading(transform()));
        });
      });
    });

    describe("when data fetching is unsuccessful", () => {
      const url = "foo";
      const err = new Error("Test error");
      beforeEach(() => {
        stubRequest(url, err);
      });

      it("emits an error value", async () => {
        const { handler, results$ } = createQueryHandler(jest.fn());
        const results = results$
          .pipe(
            take(2), // loading, error
            toArray(),
          )
          .toPromise();

        handler(url);

        jest.runAllTimers();
        expect((await results)[1]).toEqual(error());
      });
    });
  });
});
