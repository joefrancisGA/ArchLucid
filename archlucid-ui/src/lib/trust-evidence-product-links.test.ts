import { describe, expect, it } from "vitest";

import { resolveTrustEvidenceProductLink } from "@/lib/trust-evidence-product-links";

describe("trust-evidence-product-links", () => {
  it("maps API rel values to buyer-polished destinations", () => {
    expect(
      resolveTrustEvidenceProductLink(
        { rel: "evidence", path: "/v1/architecture/review/run-1/evidence", label: "Evidence package" },
        "run-1",
      ),
    ).toEqual({
      href: "/insights/evidence-graph?runId=run-1",
      label: "Open evidence trail",
    });

    expect(
      resolveTrustEvidenceProductLink(
        {
          rel: "topFindingEvidenceChain",
          path: "/v1/architecture/review/run-1/findings/f-1/evidence-chain",
          label: "Top finding evidence chain",
        },
        "run-1",
        "f-1",
      ),
    ).toEqual({
      href: "/architecture/reviews/run-1/findings/f-1/evidence-trace",
      label: "Open finding evidence trail",
    });
  });
});
