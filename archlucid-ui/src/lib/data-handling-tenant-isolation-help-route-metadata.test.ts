import { describe, expect, it } from "vitest";

import { DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA } from "@/lib/data-handling-tenant-isolation-help-route-metadata";

describe("data-handling-tenant-isolation-help-route-metadata", () => {
  it("marks the specialty guide as non-indexable operator help", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA.title).toBe("Data handling and tenant isolation");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
