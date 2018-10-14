import React from "react";

import { AsyncList, Meal } from "./AsyncList";
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

const renderListItem = ({ idMeal, strMeal }: Meal) => (
  <div key={idMeal}>{strMeal}</div>
);

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
          <AsyncList query={query} render={renderListItem} />
        </div>
      </div>
    );
  }
}

export default App;
