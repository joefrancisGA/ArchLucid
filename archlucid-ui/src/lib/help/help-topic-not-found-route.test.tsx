import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicNotFoundView } from "@/app/(operator)/help/_sections/HelpTopicNotFoundView";

const HELP_TOPIC_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

describe("HelpTopicNotFoundView TB-1599", () => {
  it("renders recovery chrome with Back to Help", () => {
    render(<HelpTopicNotFoundView />);

    expect(screen.getByTestId("help-topic-not-found")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Help topic not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Help" })).toHaveAttribute("href", "/help");
  });
});

describe("help topic catch-all not-found route TB-1599", () => {
  it("routes unknown and unloadable slugs through HelpTopicNotFoundView instead of notFound()", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE_PATH, "utf8");

    expect(pageSource).not.toContain("notFound(");
    expect(pageSource).toContain("return <HelpTopicNotFoundView />");
    expect(pageSource).toContain("if (entry === null)");
    expect(pageSource).toContain("if (loaded === null)");
  });
});
