import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
// Recompose needs to be imported before RxJS (see index.tsx), but index.tsx
// won't be loaded in tests, so import it here to make sure it gets loaded first
import "recompose";
