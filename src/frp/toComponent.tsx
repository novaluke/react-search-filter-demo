import React from "react";
import { Observable, ReplaySubject } from "rxjs";

import { M } from "./M";

interface RenderMProps<P> {
  elements: Observable<React.ReactNode[]>;
  pushProps: (props?: P) => void;
  passthrough: P;
}

interface RenderMState {
  elements: React.ReactNode[];
}

class RenderM<P> extends React.Component<RenderMProps<P>, RenderMState> {
  constructor(props: RenderMProps<P>) {
    super(props);
    this.state = { elements: [] };
  }

  public componentDidMount() {
    const { elements, pushProps, passthrough } = this.props;
    elements.subscribe(eles => this.setState({ elements: eles }));
    pushProps(passthrough);
  }

  public componentDidUpdate({ passthrough: prevPassthrough }: RenderMProps<P>) {
    const { pushProps, passthrough } = this.props;
    // TODO probably need to subscribe to the new elements if it's changed for
    // some reason (and unsubscribe from the old one)
    if (passthrough !== prevPassthrough) {
      pushProps(passthrough);
    }
  }

  public render() {
    // Use React.createElement so that a rest argument can be used to get around
    // having to specify a key for the array.
    return React.createElement(React.Fragment, {}, ...this.state.elements);
  }
}

const toComponent = <T, Props>(
  mFn: (props$: Observable<Props>) => M<T>,
): { component: (props: Props) => React.ReactNode; value: T } => {
  const props$ = new ReplaySubject<Props>();
  const m = mFn(props$);
  const component = (props: Props): React.ReactNode => {
    return (
      <RenderM
        elements={m.elements}
        passthrough={props}
        pushProps={props$.next.bind(props$)}
      />
    );
  };
  return { component, value: m.value };
};

export default toComponent;
