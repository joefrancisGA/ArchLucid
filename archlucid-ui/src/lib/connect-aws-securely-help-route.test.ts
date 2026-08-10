import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CONNECT_AWS_SECURELY_CANONICAL_PATH } from "@/lib/connect-aws-securely-help-evidence-copy";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

describe("connect-aws-securely-help-route (HEC)", () => {
  it("routes cloud-connections-aws through HelpConnectAwsSecurelyGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");
    const awsBranch = pageSource.match(
      /if \(loaded\.entry\.slug === "cloud-connections-aws"\) \{[\s\S]*?\n  \}/,
    )?.[0];

    expect(awsBranch).toBeDefined();
    expect(awsBranch).toContain("HelpConnectAwsSecurelyGuideView");
    expect(awsBranch).not.toContain("HelpTopicMarkdownView");
    expect(pageSource).toContain('loaded.entry.slug === "cloud-connections-aws"');
  });

  it("keeps the canonical help path aligned with the registry slug", () => {
    expect(CONNECT_AWS_SECURELY_CANONICAL_PATH).toBe("/help/cloud-connections/aws");
  });
});
