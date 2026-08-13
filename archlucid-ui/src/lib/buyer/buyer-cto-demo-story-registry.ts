export type CtoDemoStory = {
  readonly id: string;
  readonly label: string;
  readonly systemName: string;
  readonly policyPackLabel: string;
  readonly presenterLine: string;
};

export const CTO_DEMO_STORIES: readonly CtoDemoStory[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    systemName: "Claims Intake Modernization",
    policyPackLabel: "Healthcare Claims Policy Pack v3.4.1",
    presenterLine: "Show the board condensed outcomes for a healthcare intake modernization.",
  },
  {
    id: "fintech",
    label: "FinTech",
    systemName: "Payments Platform Migration",
    policyPackLabel: "Financial Services Compliance Pack v2.1.0",
    presenterLine: "Show the board condensed outcomes for a payments-platform modernization.",
  },
  {
    id: "retail",
    label: "Retail",
    systemName: "Loyalty Platform Re-platform",
    policyPackLabel: "Retail Data Governance Pack v1.5.0",
    presenterLine: "Show the board condensed outcomes for a loyalty platform re-platform.",
  },
  {
    id: "public-sector",
    label: "Public sector",
    systemName: "Citizen Services Modernization",
    policyPackLabel: "Government Architecture Assurance Pack v1.0.0",
    presenterLine: "Show the board condensed outcomes for a citizen-services modernization.",
  },
];

export const CTO_DEMO_DEFAULT_STORY_ID = "healthcare";

/** Vertical stories with a full static showcase payload — others are talk-track only. */
export const CTO_DEMO_STORIES_WITH_FULL_DEPTH_PAYLOAD: readonly string[] = [CTO_DEMO_DEFAULT_STORY_ID];

export function isCtoDemoStoryFullyBacked(storyId: string): boolean {
  return CTO_DEMO_STORIES_WITH_FULL_DEPTH_PAYLOAD.includes(storyId);
}

export function findCtoDemoStory(id: string): CtoDemoStory {
  const match = CTO_DEMO_STORIES.find((story) => story.id === id);

  if (match !== undefined) {
    return match;
  }

  return CTO_DEMO_STORIES[0]!;
}
