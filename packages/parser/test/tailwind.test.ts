import { describe, expect, it } from "vitest";
import { resolveTailwind } from "../src/tailwind";

describe("resolveTailwind", () => {
  it("maps base spacing tokens and passes variants, arbitrary values and custom classes through", () => {
    expect(resolveTailwind("px-4 sm:px-6 bg-blue-500 rounded-full md:pb-20 btn")).toEqual({
      style: {
        padding: { top: "0", right: "1rem", bottom: "0", left: "1rem" },
        backgroundColor: "var(--color-blue-500)",
        borderRadius: "calc(infinity * 1px)",
      },
      passthroughClasses: ["sm:px-6", "md:pb-20", "btn"],
    });
  });

  it("applies padding shorthand, then axis, then side, whatever the class order", () => {
    expect(resolveTailwind("pt-1 px-2 p-4").style.padding).toEqual({
      top: "0.25rem", right: "0.5rem", bottom: "1rem", left: "0.5rem",
    });
  });

  it("handles margins: negative, fractional, auto and px", () => {
    expect(resolveTailwind("-mx-0.5 my-px").style.margin).toEqual({
      top: "1px", right: "-0.125rem", bottom: "1px", left: "-0.125rem",
    });
    expect(resolveTailwind("mx-auto").style.margin).toEqual({
      top: "0", right: "auto", bottom: "0", left: "auto",
    });
  });

  it("maps width and height, and leaves max-w-* alone", () => {
    expect(resolveTailwind("w-60 h-full max-w-6xl")).toEqual({
      style: { width: "15rem", height: "100%" },
      passthroughClasses: ["max-w-6xl"],
    });
    expect(resolveTailwind("w-1/2 h-auto").style).toEqual({ width: "50%", height: "auto" });
    expect(resolveTailwind("w-screen h-screen").style).toEqual({ width: "100vw", height: "100vh" });
  });

  it("maps radius sizes to theme variables", () => {
    expect(resolveTailwind("rounded-2xl").style.borderRadius).toBe("var(--radius-2xl)");
    expect(resolveTailwind("rounded").style.borderRadius).toBe("0.25rem");
    expect(resolveTailwind("rounded-t-lg").passthroughClasses).toEqual(["rounded-t-lg"]);
  });

  it("tells text colour, text size and text alignment apart", () => {
    expect(resolveTailwind("text-lg text-gray-700 text-center")).toEqual({
      style: { fontSize: "var(--text-lg)", color: "var(--color-gray-700)" },
      passthroughClasses: ["text-center"],
    });
    expect(resolveTailwind("text-white bg-transparent").style).toEqual({
      color: "var(--color-white)", backgroundColor: "transparent",
    });
  });

  it("maps font weights but not font families or colour opacity modifiers", () => {
    expect(resolveTailwind("font-bold font-mono bg-blue-500/50 bg-linear-to-t")).toEqual({
      style: { fontWeight: "var(--font-weight-bold)" },
      passthroughClasses: ["font-mono", "bg-blue-500/50", "bg-linear-to-t"],
    });
  });

  it("ignores extra whitespace", () => {
    expect(resolveTailwind("  ")).toEqual({ style: {}, passthroughClasses: [] });
  });
});
