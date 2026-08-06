import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { TenantMigrationMaintenanceBanner } from "./TenantMigrationMaintenanceBanner";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

const originalFetch = globalThis.fetch;

describe("TenantMigrationMaintenanceBanner", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders maintenance copy when migration is active", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          inMigration: true,
          message: "Writes frozen during catalog move.",
          stage: "ProjectionRefresh",
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    render(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    });

    expect(screen.getByText("Writes frozen during catalog move.")).toBeInTheDocument();
  });

  it("stays hidden when migration is inactive", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ inMigration: false }), { status: 200 }),
    ) as typeof fetch;

    render(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("tenant-migration-maintenance-banner")).not.toBeInTheDocument();
  });
});
