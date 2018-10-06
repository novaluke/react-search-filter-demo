import React from "react";

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

const noop = () => null;

const App: React.SFC = () => (
  <div style={styles.headerBar}>
    <SearchInput onChange={noop} />
  </div>
);

export default App;
