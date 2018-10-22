import React from "react";
import { Observable } from "rxjs";

import { M } from "./M";

interface RenderMProps {
  render: Observable<React.ReactNode[]>;
}

interface RenderMState {
  elements: React.ReactNode[];
}

class RenderM extends React.Component<RenderMProps, RenderMState> {
  constructor(props: RenderMProps) {
    super(props);
    this.state = { elements: [] };
  }

  public componentDidMount() {
    this.props.render.subscribe(elements => this.setState({ elements }));
  }

  public render() {
    // Use React.createElement so that a rest argument can be used to get around
    // having to specify a key for the array.
    return React.createElement(React.Fragment, {}, ...this.state.elements);
  }
}

const renderM = <T>(m: M<T>) => {
  const ele = React.createElement(RenderM, {
    render: m.elements,
  });
  return { ele, value: m.value };
};

export default renderM;
