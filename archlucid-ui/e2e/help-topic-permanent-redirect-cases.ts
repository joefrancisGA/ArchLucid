import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";

export type HelpTopicPermanentRedirectCase = {
  slug: string;
  retiredPath: string;
  targetPath: string;
  targetHash: string;
  /** Optional stable destination test id when the canonical page should render in mock Admin E2E. */
  destinationTestId?: string;
};

const DESTINATION_SMOKE_TEST_IDS: Readonly<Partial<Record<string, string>>> = {
  "/help/first-architecture-review": "help-core-pilot-guide",
  "/help/api-contracts": "help-api-contracts-guide",
  "/help/review-guide": "help-review-guide",
  "/help/cloud-connections/azure": "help-connect-azure-securely-guide",
  "/help/cloud-connections/aws": "help-connect-aws-securely-guide",
  "/help/cloud-connections/gcp": "help-connect-gcp-securely-guide",
  "/help/getting-started": "help-getting-started-guide",
};

function parseRedirectTarget(target: string): { targetPath: string; targetHash: string } {
  const hashIndex = target.indexOf("#");

  if (hashIndex === -1) {
    return { targetPath: target, targetHash: "" };
  }

  return {
    targetPath: target.slice(0, hashIndex),
    targetHash: target.slice(hashIndex),
  };
}

export function buildHelpTopicPermanentRedirectCases(): HelpTopicPermanentRedirectCase[] {
  return Object.entries(HELP_TOPIC_PERMANENT_REDIRECTS).map(([slug, target]) => {
    const { targetPath, targetHash } = parseRedirectTarget(target);

    return {
      slug,
      retiredPath: `/help/${slug}`,
      targetPath,
      targetHash,
      destinationTestId: DESTINATION_SMOKE_TEST_IDS[targetPath],
    };
  });
}

export function helpTopicRedirectUrlMatches(currentUrl: string, expected: HelpTopicPermanentRedirectCase): boolean {
  const current = new URL(currentUrl);

  return current.pathname === expected.targetPath && current.hash === expected.targetHash;
}
