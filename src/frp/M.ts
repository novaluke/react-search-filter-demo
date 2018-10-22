import React from "react";
import { combineLatest, Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface M<T> {
  elements: Observable<React.ReactNode[]>;
  value: T;
}
interface Tag {
  tag: string;
  props: object;
  children: Observable<MNode[]>;
}
type MNode = string | Tag;

export type DoBlock<T> = (b: <A>(m: M<A>) => A) => T;

export const mdo = <T>(doBlock: DoBlock<T>): M<T> => {
  // Create a space to accumulate the elements from added Ms
  const childObservableElements: Array<Observable<React.ReactNode[]>> = [];

  // Create the function that will be used by the doBlock to add Ms and extract
  // their values
  const b = <A>(m: M<A>) => {
    childObservableElements.push(m.elements);
    return m.value;
  };
  // Run the do block and get the return value from it. Must be done before
  // trying to work with the accumulated elements.
  const value: T = doBlock(b);

  // Turn the nested observable elements into a flat list that can be assigned
  // to this M.
  //
  // We basically have a list of observables, each of which represents a
  // dynamically changing list of elements. So first, rather than having a list
  // of changing lists, let's use combineLatest to get a changing list of lists.
  // Then, flatten out that list of lists into a single-level list (any M that
  // was bound must automatically be a sibling, after all - if there we children
  // in the hierarchy they would already be under a ReadNode contained within an
  // M, so we don't need to worry about Node hierarchy here).
  const elements = combineLatest(childObservableElements).pipe(
    map(nested => ([] as React.ReactNode[]).concat(...nested)),
  );
  // Wrap everything up into an M
  return { elements, value };
};
