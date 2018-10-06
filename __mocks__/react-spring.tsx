import React from "react";
import { SpringProps } from "react-spring";

const mocked = jest.genMockFromModule("react-spring");
const { Spring } = require.requireActual("react-spring");

const MockSpring = <S extends object, DS extends object>(
  props: SpringProps<S, DS> & S,
) => <Spring {...props} immediate={true} />;

(mocked as any).Spring = MockSpring;

export = mocked;
