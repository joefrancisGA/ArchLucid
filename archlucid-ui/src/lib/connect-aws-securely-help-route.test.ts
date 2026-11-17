import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CONNECT_AWS_SECURELY_CANONICAL_PATH } from "@/lib/connect-aws-securely-help-evidence-copy";

const HELP_TOPIC_VIEW_RESOLVER = join(
  process.cwd(),
  "src",
  "lib",
  "help",
  "help-topic-view-resolver-integrations.tsx",
);

describe("connect-aws-securely-help-route (HEC)", () => {
  it("routes cloud-connections-aws through HelpConnectAwsSecurelyGuideView instead of bare markdown", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "cloud-connections-aws"');
    expect(resolverSource).toContain("HelpConnectAwsSecurelyGuideView");
    expect(resolverSource).not.toMatch(
      /cloud-connections-aws[\s\S]{0,400}HelpTopicMarkdownView/,
    );
  });

  it("keeps the canonical help path aligned with the registry slug", () => {
    expect(CONNECT_AWS_SECURELY_CANONICAL_PATH).toBe("/help/cloud-connections/aws");
  });
});
