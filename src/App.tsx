import React from "react";
import { of } from "rxjs";

import { AsyncList, createQueryHandler, Meal } from "AsyncList";
import { AsyncValue, init } from "common/async";
import { SearchInput } from "SearchInput";

import { renderM } from "frp";

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

const errorComponent = <span>An unknown error occurred</span>;

interface State {
  query: string;
  results: AsyncValue<Meal[]>;
}

const { ele: SearchInputEle, value: query$ } = renderM(
  SearchInput({
    setValue$: of(""),
  }),
);

class App extends React.Component<{}, State> {
  private createQueryHandler: (url: string) => void;

  constructor(props: {}) {
    super(props);
    this.state = {
      query: "",
      results: init(),
    };

    const { handler: queryHandler, results$ } = createQueryHandler(
      response => response.meals || [],
    );
    // Enable other methods to send new queries
    this.createQueryHandler = queryHandler;
    // When results arrive, add them to the state
    results$.subscribe(results => this.setState({ results }));
  }

  public componentDidMount() {
    query$.subscribe(this.onQueryChange);
  }

  public onQueryChange = (query: string) => {
    this.setState({ query });
    // Reset back to initial state if there is no query - sending a blank query
    // makes no sense for this use case
    if (query.length > 0) {
      const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
      this.createQueryHandler(url);
    } else {
      this.setState({ results: init() });
    }
  };

  public render() {
    const { query, results } = this.state;
    const noResultsComponent = <span>No results found for "{query}"</span>;
    return (
      <div>
        <div style={styles.headerBar}>{SearchInputEle}</div>
        <div>
          <AsyncList
            results={results}
            render={renderListItem}
            errorComponent={errorComponent}
            noResultsComponent={noResultsComponent}
          />
        </div>
      </div>
    );
  }
}

export default App;
