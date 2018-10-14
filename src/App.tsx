import React from "react";

import { AsyncList } from "./AsyncList";
import SearchInput from "./SearchInput";

const styles = {
  headerBar: {
    backgroundColor: "#0af",
    display: "flex",
    height: "35px",
    justifyContent: "flex-end",
    padding: "5px",
  },
};

class App extends React.Component<{}, { query: string }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      query: "",
    };
  }

  public onQueryChange = (query: string) => {
    this.setState({ query });
  };

  public render() {
    const { query } = this.state;
    return (
      <div>
        <div style={styles.headerBar}>
          <SearchInput onChange={this.onQueryChange} />
        </div>
        <div>
          <AsyncList query={query} />
        </div>
      </div>
    );
  }
}

export default App;
