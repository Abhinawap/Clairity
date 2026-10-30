import { describe, expect, it } from "vitest";
import { generateMetadata } from "../app/editor/page";
import { metadata as loginMetadata } from "../app/login/page";
import { metadata as projectsMetadata } from "../app/projects/page";
import { metadata as registerMetadata } from "../app/register/page";

describe("page metadata", () => {
  it("names the auth and projects pages", () => {
    expect(loginMetadata.title).toBe("Login");
    expect(projectsMetadata.title).toBe("Projects");
    expect(registerMetadata.title).toBe("Register");
  });

  it("uses the workspace name in the editor title", async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ workspace: "harbor-console" }) });
    expect(metadata.title).toBe("harbor-console");
  });

  it("falls back to the editor title without a workspace", async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.title).toBe("Editor");
  });
});
