import React from "react";
import { FaSpinner } from "react-icons/fa";

import { Action, fetchResults } from "./actions";
import { reducer, State } from "./reducer";

export interface Props {
  query: string;
}

class Filter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      loading: false,
      results: [],
    };
  }

  public reducer(action: Action) {
    return reducer(this.state, action);
  }

  public dispatch = (action: Action) => {
    this.setState(this.reducer(action));
  };

  // May be called for a variety of reasons, not all of which involve `query`
  // being updated - must check it has updated to avoid excess queries
  public componentDidUpdate({ query }: Props) {
    if (query !== this.props.query) {
      fetchResults(this.url, this.dispatch);
    }
  }

  // `componentDidUpdate` doesn't fire on mount, so handle initial fetch here
  public componentDidMount() {
    if (this.props.query) {
      fetchResults(this.url, this.dispatch);
    }
  }

  private get url() {
    return `https://www.themealdb.com/api/json/v1/1/search.php?s=${
      this.props.query
    }`;
  }

  public render() {
    const { query } = this.props;
    const { hasError, loading, results } = this.state;
    return (
      <div>
        {hasError ? <span>An error occurred</span> : null}
        {loading ? <FaSpinner data-testid="loading" /> : null}
        {results.length === 0 && query && !loading ? (
          <span>No results found for "{query}"</span>
        ) : (
          results.map(result => <div key={result.idMeal}>{result.strMeal}</div>)
        )}
      </div>
    );
  }
}

export default Filter;
