import axios from "axios";
import React from "react";
import { FaSpinner } from "react-icons/fa";

export interface Props {
  query: string;
}

interface State {
  hasError: boolean;
  loading: boolean;
  results: any[];
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

  // May be called for a variety of reasons, not all of which involve `query`
  // being updated - must check it has updated to avoid excess queries
  public componentDidUpdate({ query }: Props) {
    if (query !== this.props.query) {
      this.fetchResults();
    }
  }

  // `componentDidUpdate` doesn't fire on mount, so handle initial fetch here
  public componentDidMount() {
    if (this.props.query) {
      this.fetchResults();
    }
  }

  // TODO figure out what the proper type for an explicit declaration would be
  // (there are different types of Timer for browser vs node)
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  private fetchResults() {
    this.setState({ hasError: false, loading: true });

    // Debounce queries with a 500ms window
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      axios
        .get(this.url())
        .then(response => {
          this.setState({
            loading: false,
            results: response.data.meals || [],
          });
        })
        .catch(_ => {
          this.setState({
            hasError: true,
            loading: false,
          });
        });
    }, 500);
  }

  private url() {
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
