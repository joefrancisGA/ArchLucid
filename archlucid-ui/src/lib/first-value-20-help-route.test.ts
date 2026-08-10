import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { FIRST_VALUE_20_HELP_ROUTE_METADATA } from "@/lib/first-value-20-help-route-metadata";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");
const HELP_TOPIC_MARKDOWN_CLIENT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "_sections",
  "HelpTopicMarkdownClient.tsx",
);

describe("first-value-20-help-route", () => {
  it("keeps the canonical Admin path and runbook-safe metadata", () => {
    expect(FIRST_VALUE_20_HELP_PATH).toBe("/help/first-value-20-minutes");
    expect(FIRST_VALUE_20_HELP_ROUTE_METADATA.title).toBe("First value in 20 minutes (Admin runbook)");
    expect(String(FIRST_VALUE_20_HELP_ROUTE_METADATA.description ?? "").toLowerCase()).toContain(
      "not the default customer",
    );
  });

  it("routes browser navigations without Authorization through HelpFirstValue20GuideView", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");
    const clientSource = readFileSync(HELP_TOPIC_MARKDOWN_CLIENT, "utf8");

    expect(pageSource).toContain('entry.contentKind === "internal-runbook"');
    expect(pageSource).toContain("HelpTopicMarkdownClient");
    expect(clientSource).toContain('props.entry.slug === "first-value-20-minutes"');
    expect(clientSource).toContain("HelpFirstValue20GuideView");
  });
});
