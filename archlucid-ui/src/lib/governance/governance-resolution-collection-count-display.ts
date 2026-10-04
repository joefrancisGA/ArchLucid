import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

export function presentGovernanceResolutionCollectionCount(
  data: EffectiveGovernanceResolutionResult | null | undefined,
  key: "decisions" | "conflicts",
): string {
  if (data === null || data === undefined) {
    return "Not returned";
  }

  const collection = data[key];

  if (!Array.isArray(collection)) {
    return "Not returned";
  }

  return String(collection.length);
}

export function formatGovernanceResolutionWorkingResultsLabel(
  loading: boolean,
  data: EffectiveGovernanceResolutionResult | null | undefined,
): string {
  if (loading) {
    return "Loading resolution…";
  }

  const decisionsCount = presentGovernanceResolutionCollectionCount(data, "decisions");
  const conflictsCount = presentGovernanceResolutionCollectionCount(data, "conflicts");

  const decisionsLabel =
    decisionsCount === "Not returned" ? "Decisions not returned" : `${decisionsCount} decisions`;
  const conflictsLabel =
    conflictsCount === "Not returned" ? "Conflicts not returned" : `${conflictsCount} conflicts`;

  return `${decisionsLabel} · ${conflictsLabel}`;
}

export function governanceResolutionSectionCountHeading(
  noun: "decisions" | "conflicts",
  data: EffectiveGovernanceResolutionResult | null | undefined,
): string {
  const count = presentGovernanceResolutionCollectionCount(data, noun);

  if (count === "Not returned") {
    return noun === "decisions" ? "Resolution decisions (not returned)" : "Policy pack conflicts (not returned)";
  }

  if (noun === "decisions") {
    return `Resolution decisions (${count})`;
  }

  return `Policy pack conflicts (${count})`;
}
