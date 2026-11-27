import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";

export const SECURENOW_DEMO_FIXTURE_PATH_ID = "fixture-path-01" as const;

export const SECURENOW_SYNTHETIC_FIXTURE_PATH_IDS = [
  "fixture-path-01",
  "fixture-path-02",
  "fixture-path-03",
] as const;

const SECURENOW_SYNTHETIC_FIXTURE_PATH_ID_SET = new Set<string>(SECURENOW_SYNTHETIC_FIXTURE_PATH_IDS);

export function isSecureNowSyntheticFixturePathId(pathId: string | null | undefined): boolean {
  const normalized = pathId?.trim().toLowerCase() ?? "";

  return SECURENOW_SYNTHETIC_FIXTURE_PATH_ID_SET.has(normalized);
}

export function secureNowSyntheticFixtureDisciplineForPathId(pathId: string | null | undefined): string | null {
  if (!isSecureNowSyntheticFixturePathId(pathId)) {
    return null;
  }

  return SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE;
}