import { FaSearch, FaTimesCircle } from "react-icons/fa";
import { Spring } from "react-spring";
import { combineLatest, merge, Observable, of, ReplaySubject } from "rxjs";
import { map, mapTo, startWith } from "rxjs/operators";

import "./SearchInput.css";

import { dyn, el, M, mdo, rec, text, textInput, toComponent } from "frp";

export interface Props {
  setValue$: Observable<string>;
  closedWidth$?: Observable<number>;
  openWidth$?: Observable<number>;
  color$?: Observable<string>;
}

// TODO figure out how to type this so that it warns if it doesn't match up with
// Props, but also so that it doesn't tell TS that any of these might not exist
const defaultProps = {
  closedWidth$: of(5),
  color$: of("white"),
  openWidth$: of(200),
};

function makeStream<T>(seed?: T) {
  const subject = new ReplaySubject<T>();
  return {
    push: subject.next.bind(subject) as (val: T) => void,
    stream: seed === undefined ? subject : subject.pipe(startWith(seed)),
  };
}

const mkInput = (
  setValue: Observable<string>,
  width$: Observable<number>,
): M<{ value: Observable<string>; hasFocus: Observable<boolean> }> => {
  return mdo(b => {
    return rec<{
      setValue: string;
      hasFocus: boolean;
    }>()(scope => {
      const { change, value, hasFocus } = b(
        textInput({
          attributes: combineLatest(scope.hasFocus, width$).pipe(
            map(([hasFocus2, width]) => ({
              className: "search-input-textinput",
              placeholder: hasFocus2 ? "Search for Media..." : "",
              style: { width },
            })),
          ),
          setValue: scope.setValue,
        }),
      );
      scope.hasFocus = hasFocus;
      scope.setValue = merge(change, setValue);
      return { value, hasFocus };
    });
  });
};

const SearchInput: (props: Props) => M<Observable<string>> = props => {
  const { setValue$, closedWidth$, openWidth$, color$ } = {
    ...defaultProps,
    ...props,
  };
  return mdo(a => {
    const labelProps = color$.pipe(
      map(color => ({
        className: "search-input-container",
        style: {
          color,
          borderColor: color,
        },
      })),
    );
    return a(
      el("label", labelProps, b => {
        interface SpringProps {
          from: { width: number };
          to: { width: number };
          render: (props: { width: number }) => void;
        }
        return rec<{ reset$: void; springProps: SpringProps }>()(scope => {
          b(el(Spring, scope.springProps, text("")));
          const {
            component: renderInput,
            value: { value, hasFocus },
          } = toComponent((props$: Observable<{ width: number }>) => {
            const width$ = props$.pipe(map(({ width }) => width));
            return mkInput(
              merge(scope.reset$.pipe(mapTo("")), setValue$),
              width$,
            );
          });

          scope.springProps = combineLatest(
            closedWidth$,
            openWidth$,
            hasFocus,
          ).pipe(
            map(([closedWidth, openWidth, isOpen]) => ({
              from: { width: closedWidth },
              render: renderInput,
              to: { width: isOpen === true ? openWidth : closedWidth },
            })),
          );
          // Only needed because we don't have a way to hook up DOM events
          // properly yet
          const { push, stream } = makeStream<void>();
          scope.reset$ = stream;
          // prettier-ignore
          b(dyn(value.pipe(map(val =>
            val
              ? el(
                  FaTimesCircle,
                  of({ className: "search-input-icon", onClick: push }),
                  text(""), // TODO allow childM to be omitted
                )
              : el(
                  FaSearch,
                  of({ className: "search-input-icon" }),
                  text(""),
                ),
          ))));
          return value;
        });
      }),
    );
  });
};

export default SearchInput;
