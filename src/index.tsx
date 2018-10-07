import React from "react";
import { render } from "react-dom";
// Recompose includes a polyfill that needs to be imported prior to importing
// RxJS for the first time, so get that loaded here to make sure it's first.
import "recompose";

import App from "./App";

render(<App />, document.getElementById("root"));
