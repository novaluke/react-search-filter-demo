import React from "react";
import { FaSearch } from "react-icons/fa";
import { Spring } from "react-spring";

import "./SearchInput.css";

export interface Props {
  onChange: (value: string) => void;
  closedWidth?: number;
  openWidth?: number;
  color?: string;
}

interface State {
  isOpen: boolean;
  hasValue: boolean;
}

class SearchInput extends React.Component<Props, State> {
  public static defaultProps = {
    closedWidth: 5,
    color: "white",
    openWidth: 200,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasValue: false,
      isOpen: false,
    };
  }

  public onFocus = () => this.setState({ isOpen: true });

  public onBlur = () => {
    if (!this.state.hasValue) {
      this.setState({ isOpen: false });
    }
  };

  // Keep track of whether or not the input has a value, so onBlur can use it to
  // make closing the input contingent on being empty
  public onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ hasValue: value.length > 0 });
    this.props.onChange(value);
  };

  public render() {
    const { isOpen } = this.state;
    const { closedWidth, openWidth, color } = this.props;
    return (
      <label
        className="search-input-container"
        style={{ color, borderColor: color }}
      >
        <Spring
          from={{ width: closedWidth }}
          to={{ width: isOpen ? openWidth : closedWidth }}
        >
          {({ width }) => (
            <input
              type="text"
              className="search-input-textinput"
              style={{ width }}
              onChange={this.onChange}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              placeholder={isOpen ? "Search for Media..." : ""}
            />
          )}
        </Spring>
        <FaSearch className="search-input-icon" />
      </label>
    );
  }
}

export default SearchInput;
