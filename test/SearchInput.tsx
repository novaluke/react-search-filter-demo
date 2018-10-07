jest.mock("react-spring");

import React from "react";
import { fireEvent, render } from "react-testing-library";

import SearchInput from "SearchInput";

describe("SearchInput", () => {
  const noop = jest.fn();
  const openWidth = 500;
  const closedWidth = 50;

  it("calls the onChange prop when text is entered", () => {
    const onChange = jest.fn();
    const enteredText = "cats";
    const input = render(
      <SearchInput onChange={onChange} />,
    ).container.querySelector("input")!;

    fireEvent.change(input, { target: { value: enteredText } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(enteredText);
  });

  it("starts collapsed", () => {
    const input = render(
      <SearchInput onChange={noop} closedWidth={closedWidth} />,
    ).container.querySelector("input")!;

    expect(input.style).toHaveProperty("width", `${closedWidth}px`);
  });

  it("applies the color prop to the label", () => {
    // CSS rules will ensure the color is inherited down to the children
    const color = "black";
    const labelStyles = render(
      <SearchInput onChange={noop} color={color} />,
    ).container.querySelector("label")!.style;

    expect(labelStyles).toHaveProperty("color", color);
    expect(labelStyles).toHaveProperty("border-color", color);
  });

  it("sets the icon as a label for the input", () => {
    // This ensures that clicking on the icon will focus the text input -
    // increases the available area for interaction, making it easier for the
    // user to interact with it when collapsed, and matches user assumption that
    // clicking on a "search" icon takes some kind of action towards initiating
    // a search.
    const { container } = render(
      <SearchInput onChange={noop} closedWidth={closedWidth} />,
    );
    const label = container.querySelector("label")!;
    const input = container.querySelector("input")!;
    const icon = container.querySelector("svg")!;

    // Expect label is connected to input and contains the icon
    expect(label.control).toBe(input);
    expect(label.contains(icon)).toBe(true);
  });

  describe("when the input has text", () => {
    xit("uses a cancel icon", () => {
      /* const { container } = render(<SearchInput onChange={noop} />); */
      /* const input = container.querySelector("input")!; */
      /* const icon = container.querySelector("svg")!; */
      /* fireEvent.change(input, { target: { value: "cats" } }); */
      // TODO use an icon library that facilitates being able to assert on the icons
    });

    it("clears the input when the icon is clicked", () => {
      const { container } = render(<SearchInput onChange={noop} />);
      const input = container.querySelector("input")!;

      fireEvent.change(input, { target: { value: "cats" } });
      expect(input.value).toEqual("cats");

      // Have to typecast to `any` because `.click` is typed to only work on an
      // HTML element, not an SVG one (even though SVG does have `onclick` etc.)
      fireEvent.click(container.querySelector("svg")! as any);

      expect(input.value).toEqual("");
    });
  });

  describe("when the input is empty", () => {
    xit("uses a search icon", () => {
      /* const { container } = render(<SearchInput onChange={noop} />); */
      /* const input = container.querySelector("input")!; */
      /* const icon = container.querySelector("svg")!; */
      /* fireEvent.change(input, { target: { value: "" } }); */
      // TODO use an icon library that facilitates being able to assert on the icons
    });
  });

  describe("when the input is focused", () => {
    it("expands", () => {
      const input = render(
        <SearchInput onChange={noop} openWidth={openWidth} />,
      ).container.querySelector("input")!;

      fireEvent.focus(input);

      expect(input.style).toHaveProperty("width", `${openWidth}px`);
    });
  });

  describe("when the input loses focus", () => {
    describe("if the input is empty", () => {
      it("closes", () => {
        const input = render(
          <SearchInput onChange={noop} closedWidth={closedWidth} />,
        ).container.querySelector("input")!;

        fireEvent.focus(input);
        expect(input.style).not.toHaveProperty("width", `${closedWidth}px`);

        fireEvent.blur(input);
        expect(input.style).toHaveProperty("width", `${closedWidth}px`);
      });
    });

    describe("if the input has text", () => {
      it("stays open", () => {
        const input = render(
          <SearchInput onChange={noop} openWidth={openWidth} />,
        ).container.querySelector("input")!;

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: "cats" } });

        fireEvent.blur(input);
        expect(input.style).toHaveProperty("width", `${openWidth}px`);
      });
    });
  });
});
