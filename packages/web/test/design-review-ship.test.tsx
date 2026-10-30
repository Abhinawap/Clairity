import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DesignReviewShip, WorkflowSection } from "../components/design-review-ship";

describe("DesignReviewShip", () => {
  it("renders default headline and subheadline with proper typography classes", () => {
    const html = renderToStaticMarkup(<DesignReviewShip />);
    expect(html).toContain("DESIGN, REVIEW, &amp; SHIP");
    expect(html).toContain("font-dirtyline");
    expect(html).toContain("var(--font-dirtyline)");
    expect(html).toContain("Clarity turns your design intent into real code changes");
    expect(html).toContain("bg-[#DAF5EE]");
  });

  it("renders all four workflow steps and descriptions", () => {
    const html = renderToStaticMarkup(<DesignReviewShip />);
    expect(html).toContain("Pick an element directly on the page");
    expect(html).toContain("Click on any element in your website and see its structure in the layer tree");

    expect(html).toContain("Adjust the design using visual controls or AI.");
    expect(html).toContain("Use the inspector for precise changes or let AI handle the details");

    expect(html).toContain("Inspect the proposed changes in a code diff.");
    expect(html).toContain("See exactly what&#x27;s changing, line by line");

    expect(html).toContain("Accept the changes into your project.");
    expect(html).toContain("Once you&#x27;re happy, apply the changes");
  });

  it("supports wireframe mode", () => {
    const html = renderToStaticMarkup(<DesignReviewShip wireframe />);
    expect(html).toContain("bg-[#D9D9D9]");
    expect(html).not.toContain("Hero Button");
  });

  it("allows custom headline and custom steps", () => {
    const customSteps = [
      {
        id: "step-custom",
        title: "Custom Title",
        description: "Custom Description",
      },
    ];

    const html = renderToStaticMarkup(
      <DesignReviewShip
        headline="CUSTOM HEADLINE"
        subheadline="Custom subheadline text"
        steps={customSteps}
      />
    );

    expect(html).toContain("CUSTOM HEADLINE");
    expect(html).toContain("Custom subheadline text");
    expect(html).toContain("Custom Title");
    expect(html).toContain("Custom Description");
  });

  it("exports WorkflowSection as an alias", () => {
    expect(WorkflowSection).toBe(DesignReviewShip);
  });
});
