import { expect, it } from "vitest";
import { styleToCss } from "../lib/style-to-css";

it("collapses padding and margin to shorthand and passes every other property through", () => {
  expect(
    styleToCss({
      padding: { top: "0", right: "1rem", bottom: "0", left: "1rem" },
      margin: { top: "0", right: "auto", bottom: "1.5rem", left: "auto" },
      fontSize: "var(--text-5xl)",
    }),
  ).toEqual({ padding: "0 1rem 0 1rem", margin: "0 auto 1.5rem auto", fontSize: "var(--text-5xl)" });
  expect(styleToCss({})).toEqual({});
});
