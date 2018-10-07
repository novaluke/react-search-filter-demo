import React from "react";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
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
  value: string;
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
      isOpen: false,
      value: "",
    };
  }

  public onFocus = () => this.setState({ isOpen: true });

  public onBlur = () => {
    if (!this.state.value) {
      this.setState({ isOpen: false });
    }
  };

  public onChange = ({ target: { value } }: { target: { value: string } }) => {
    this.setState({ value });
    this.props.onChange(value);
  };

  public reset = () => {
    // Mimic the structure of a change event so we don't have to add another
    // handler to accept just strings
    this.onChange({ target: { value: "" } });
  };

  public render() {
    const { isOpen, value } = this.state;
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
              value={value}
              className="search-input-textinput"
              style={{ width }}
              onChange={this.onChange}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              placeholder={isOpen ? "Search for Media..." : ""}
            />
          )}
        </Spring>
        {value ? (
          <FaTimesCircle className="search-input-icon" onClick={this.reset} />
        ) : (
          <FaSearch className="search-input-icon" />
        )}
      </label>
    );
  }
}

export default SearchInput;
