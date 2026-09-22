import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { apiPutJson } from "@/lib/api/http";
import {
  getReviewAssumptionAcknowledgement,
  putReviewAssumptionAcknowledgement,
} from "@/lib/api/review-assumption-acknowledgement-api";

vi.mock("@/lib/api/api-get-sealed-manifest-aware", () => ({
  apiGetSealedManifestAware: vi.fn(),
}));

vi.mock("@/lib/api/http", () => ({
  apiPutJson: vi.fn(),
}));

const RUN_ID = "0b0f7d2e-5b3d-4c8a-9d2f-1a2b3c4d5e6f";
const EXPECTED_PATH = `/v1/architecture/review/${RUN_ID}/assumptions/acknowledgement`;

describe("review-assumption-acknowledgement-api", () => {
  beforeEach(() => {
    vi.mocked(apiGetSealedManifestAware).mockReset();
    vi.mocked(apiPutJson).mockReset();
  });

  it("GETs the sealed-manifest-aware acknowledgement document and trims the run id", async () => {
    const document = {
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: ["a"],
    };
    vi.mocked(apiGetSealedManifestAware).mockResolvedValue(document);

    await expect(getReviewAssumptionAcknowledgement(` ${RUN_ID} `)).resolves.toEqual(document);
    expect(apiGetSealedManifestAware).toHaveBeenCalledWith(EXPECTED_PATH);
  });

  it("PUTs the full acknowledged id array", async () => {
    vi.mocked(apiPutJson).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: ["a", "b"],
    });

    await putReviewAssumptionAcknowledgement(RUN_ID, new Set(["a", "b"]));

    expect(apiPutJson).toHaveBeenCalledWith(EXPECTED_PATH, { acknowledgedAssumptionIds: ["a", "b"] });
  });
});
