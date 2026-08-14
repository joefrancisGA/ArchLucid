import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const nav = vi.hoisted(() => ({ callerAuthorityRank: 3 }));

const listPlatformBundledPolicyPacks = vi.fn();
const setPlatformBundledPolicyPackActivation = vi.fn();

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => nav.callerAuthorityRank,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: nav.callerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listPlatformBundledPolicyPacks: (...args: unknown[]) => listPlatformBundledPolicyPacks(...args),
    setPlatformBundledPolicyPackActivation: (...args: unknown[]) => setPlatformBundledPolicyPackActivation(...args),
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AdminPlatformBundledPolicyPacksPageClient } from "./AdminPlatformBundledPolicyPacksPageClient";

const sampleRow = {
  bundleContentFile: "aws-waf.json",
  displayName: "AWS Well-Architected Framework",
  isGloballyActive: true,
  updatedUtc: "2026-07-01T00:00:00.000Z",
};

describe("AdminPlatformBundledPolicyPacksPageClient", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    listPlatformBundledPolicyPacks.mockReset();
    setPlatformBundledPolicyPackActivation.mockReset();
    listPlatformBundledPolicyPacks.mockResolvedValue([sampleRow]);
    setPlatformBundledPolicyPackActivation.mockResolvedValue({
      ...sampleRow,
      isGloballyActive: false,
    });
  });

  it("gates deactivate behind typed confirmation and skips API until confirmed", async () => {
    render(<AdminPlatformBundledPolicyPacksPageClient />);

    const toggle = await screen.findByTestId(`platform-bundled-policy-pack-toggle-${sampleRow.bundleContentFile}`);

    fireEvent.click(toggle);

    const heading = await screen.findByRole("heading", {
      name: `Deactivate "${sampleRow.displayName}" globally?`,
    });
    const dialog = heading.closest('[role="alertdialog"]');

    expect(dialog).not.toBeNull();
    expect(setPlatformBundledPolicyPackActivation).not.toHaveBeenCalled();

    const confirm = within(dialog as HTMLElement).getByRole("button", { name: "Deactivate globally" });

    expect(confirm).toBeDisabled();

    fireEvent.change(
      within(dialog as HTMLElement).getByTestId("platform-bundled-policy-pack-deactivate-acknowledgment-input"),
      { target: { value: sampleRow.displayName } },
    );

    expect(confirm).not.toBeDisabled();

    fireEvent.click(confirm);

    await waitFor(() => {
      expect(setPlatformBundledPolicyPackActivation).toHaveBeenCalledWith(sampleRow.bundleContentFile, false);
    });
  });

  it("uses accessible action names and table aria label", async () => {
    render(<AdminPlatformBundledPolicyPacksPageClient />);

    await screen.findByTestId(`platform-bundled-policy-pack-${sampleRow.bundleContentFile}`);

    expect(
      screen.getByRole("button", { name: `Deactivate globally — ${sampleRow.displayName}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Platform bundled policy packs" })).toBeInTheDocument();
  });

  it("filters rows by display name", async () => {
    listPlatformBundledPolicyPacks.mockResolvedValue([
      sampleRow,
      {
        bundleContentFile: "azure-waf.json",
        displayName: "Azure Well-Architected Framework",
        isGloballyActive: false,
        updatedUtc: "2026-07-02T00:00:00.000Z",
      },
    ]);

    render(<AdminPlatformBundledPolicyPacksPageClient />);

    await screen.findByTestId(`platform-bundled-policy-pack-${sampleRow.bundleContentFile}`);

    fireEvent.change(screen.getByTestId("platform-bundled-policy-packs-name-filter"), {
      target: { value: "Azure" },
    });

    expect(screen.queryByTestId(`platform-bundled-policy-pack-${sampleRow.bundleContentFile}`)).toBeNull();
    expect(screen.getByTestId("platform-bundled-policy-pack-azure-waf.json")).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    listPlatformBundledPolicyPacks.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    render(<AdminPlatformBundledPolicyPacksPageClient />);

    expect(screen.getByRole("table", { name: "Platform bundled policy packs" })).toBeInTheDocument();
  });

  it("wires failure retry to reload registry", async () => {
    listPlatformBundledPolicyPacks.mockRejectedValueOnce(new Error("Registry unavailable"));
    listPlatformBundledPolicyPacks.mockResolvedValueOnce([sampleRow]);

    render(<AdminPlatformBundledPolicyPacksPageClient />);

    const failure = await screen.findByTestId("platform-bundled-policy-packs-load-failure");

    fireEvent.click(within(failure).getByRole("button", { name: "Reload registry" }));

    await waitFor(() => {
      expect(screen.getByTestId(`platform-bundled-policy-pack-${sampleRow.bundleContentFile}`)).toBeInTheDocument();
    });

    expect(listPlatformBundledPolicyPacks).toHaveBeenCalledTimes(2);
  });

  it("keeps toggled row state when post-mutation reload fails", async () => {
    listPlatformBundledPolicyPacks.mockResolvedValueOnce([sampleRow]);
    setPlatformBundledPolicyPackActivation.mockResolvedValueOnce({
      ...sampleRow,
      isGloballyActive: false,
    });
    listPlatformBundledPolicyPacks.mockRejectedValueOnce(new Error("Registry unavailable"));

    render(<AdminPlatformBundledPolicyPacksPageClient />);

    const toggle = await screen.findByTestId(`platform-bundled-policy-pack-toggle-${sampleRow.bundleContentFile}`);

    fireEvent.click(toggle);

    const heading = await screen.findByRole("heading", {
      name: `Deactivate "${sampleRow.displayName}" globally?`,
    });
    const dialog = heading.closest('[role="alertdialog"]');

    fireEvent.change(
      within(dialog as HTMLElement).getByTestId("platform-bundled-policy-pack-deactivate-acknowledgment-input"),
      { target: { value: sampleRow.displayName } },
    );
    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Deactivate globally" }));

    await waitFor(() => {
      expect(setPlatformBundledPolicyPackActivation).toHaveBeenCalledWith(sampleRow.bundleContentFile, false);
    });

    expect(await screen.findByTestId("platform-bundled-policy-packs-load-failure")).toBeInTheDocument();
    expect(screen.queryByTestId("platform-bundled-policy-packs-toggle-status")).toBeNull();
    expect(
      screen.getByRole("button", { name: `Activate globally — ${sampleRow.displayName}` }),
    ).toBeInTheDocument();
  });
});
