import { describe, expect, it } from "vitest";

import {
  formatResourceHubTabCompactLabel,
  formatResourceHubTabViewLabel,
} from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";

describe("infra-evidence-hub-tab-labels", () => {
  it("formats canonical hub tab view labels", () => {
    expect(formatResourceHubTabViewLabel("overview")).toBe("View overview in hub");
    expect(formatResourceHubTabViewLabel("findings")).toBe("View findings in hub");
    expect(formatResourceHubTabViewLabel("remediation")).toBe("View remediation in hub");
    expect(formatResourceHubTabViewLabel("drift")).toBe("View drift in hub");
    expect(formatResourceHubTabViewLabel("diagram")).toBe("View diagram correspondence in hub");
    expect(formatResourceHubTabViewLabel("terraform")).toBe("View terraform mapping in hub");
    expect(formatResourceHubTabViewLabel("audit")).toBe("View audit lineage in hub");
  });

  it("formats compact hub tab labels for scoped banners", () => {
    expect(formatResourceHubTabCompactLabel("terraform")).toBe("Terraform mapping");
    expect(formatResourceHubTabCompactLabel("audit")).toBe("Audit lineage");
  });
});
