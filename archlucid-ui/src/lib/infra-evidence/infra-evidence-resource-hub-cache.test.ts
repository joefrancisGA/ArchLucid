import { describe, expect, it } from "vitest";

import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildInfraEvidenceResourceHubCacheKey,
  readCachedInfraEvidenceResourceHub,
  writeCachedInfraEvidenceResourceHub,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";

describe("infra-evidence-resource-hub-cache", () => {
  it("reads and writes cached hub payloads by resource and snapshot", () => {
    const cacheKey = buildInfraEvidenceResourceHubCacheKey(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    );
    const hub = {
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
    } as CloudResourceEvidenceHubResponse;

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toBeNull();

    writeCachedInfraEvidenceResourceHub(cacheKey, hub);

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toEqual(hub);
  });
});
