import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";

export const SECURENOW_DEMO_FIXTURE_PATH_ID = "fixture-path-01" as const;

export function isSecureNowSyntheticFixturePathId(pathId: string | null | undefined): boolean {
  const normalized = pathId?.trim().toLowerCase() ?? "";

  return normalized === SECURENOW_DEMO_FIXTURE_PATH_ID;
}

export function secureNowSyntheticFixtureDisciplineForPathId(pathId: string | null | undefined): string | null {
  if (!isSecureNowSyntheticFixturePathId(pathId)) {
    return null;
  }

  return SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE;
}