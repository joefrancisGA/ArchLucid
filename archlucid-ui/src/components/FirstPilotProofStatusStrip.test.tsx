import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FirstPilotProofStatusStrip } from "@/components/FirstPilotProofStatusStrip";
import { BUYER_PILOT_EVIDENCE_PENDING } from "@/lib/buyer/buyer-home-status-copy";
import {
  FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND,
  FIRST_PILOT_PROOF_STATUS_UNAVAILABLE,
  FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
  FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY,
} from "@/lib/first-pilot-diagnostics-copy";
import type { FirstPilotProofStatusSnapshot } from "@/lib/first-pilot-proof-status-snapshot";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const fetchFirstPilotProofStatusSnapshot = vi.hoisted(() => vi.fn());

vi.mock("@/lib/first-pilot-proof-status-snapshot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/first-pilot-proof-status-snapshot")>();

  return {
    ...actual,
    fetchFirstPilotProofStatusSnapshot,
  };
});

function makeSnapshot(disposition: "PASS" | "WARN" | "BLOCK" | "NOT_RUN"): FirstPilotProofStatusSnapshot {
  return {
    generatedUtc: "2026-01-01T00:00:00Z",
    disposition,
    verdict: disposition,
    blockCount: disposition === "BLOCK" ? 1 : 0,
    warnCount: disposition === "WARN" ? 2 : 0,
    nextAction: "Run collect-first-pilot-proof.ps1 or dotnet run --project ArchLucid.Cli -- pilot proof after your first committed review.",
    proofFolder: null,
    remediationLinks: [],
  };
}

function cliCommand(): HTMLElement {
  return screen.getByText(FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND);
}

function openTechnicalCommandDisclosure(): void {
  fireEvent.click(screen.getByText(FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY));
}

describe("FirstPilotProofStatusStrip", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    fetchFirstPilotProofStatusSnapshot.mockReset();
    fetchFirstPilotProofStatusSnapshot.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("load-failed state", () => {
    it("shows operator-safe unavailable copy without CLI text", async () => {
      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      expect(await screen.findByText(FIRST_PILOT_PROOF_STATUS_UNAVAILABLE)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA })).toHaveAttribute("href", "/administration/system-health");
      expect(screen.queryByText(/Proof status not loaded/i)).not.toBeInTheDocument();
      expect(cliCommand()).not.toBeVisible();
    });

    it("exposes CLI commands only after expanding the technical disclosure", async () => {
      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      await screen.findByText(FIRST_PILOT_PROOF_STATUS_UNAVAILABLE);

      expect(
        screen.getByText(FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY).closest("details"),
      ).not.toHaveAttribute("open");

      openTechnicalCommandDisclosure();

      expect(await screen.findByText(FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND)).toBeVisible();
    });
  });

  describe("NOT_RUN disposition", () => {
    it("shows operator-safe not-collected copy without CLI text visible", async () => {
      fetchFirstPilotProofStatusSnapshot.mockResolvedValue(makeSnapshot("NOT_RUN"));

      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      expect(await screen.findByText(BUYER_PILOT_EVIDENCE_PENDING)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA })).toHaveAttribute("href", "/administration/system-health");
      expect(screen.queryByText(/Proof status not loaded/i)).not.toBeInTheDocument();
      expect(
        screen.getByText(FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY).closest("details"),
      ).not.toHaveAttribute("open");
      expect(cliCommand()).not.toBeVisible();
    });

    it("exposes CLI commands only after expanding the technical disclosure", async () => {
      fetchFirstPilotProofStatusSnapshot.mockResolvedValue(makeSnapshot("NOT_RUN"));

      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      await screen.findByText(BUYER_PILOT_EVIDENCE_PENDING);

      expect(
        screen.getByText(FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY).closest("details"),
      ).not.toHaveAttribute("open");

      openTechnicalCommandDisclosure();

      expect(await screen.findByText(FIRST_PILOT_PROOF_REFRESH_CLI_COMMAND)).toBeVisible();
    });
  });

  describe("PASS disposition", () => {
    it("shows verdict badge and summary without nextAction CLI text", async () => {
      fetchFirstPilotProofStatusSnapshot.mockResolvedValue(makeSnapshot("PASS"));

      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      expect(await screen.findByText("PASS")).toBeInTheDocument();
      expect(screen.getByText("No blocks or warnings.")).toBeInTheDocument();
      expect(screen.queryByText(/dotnet run/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/collect-first-pilot-proof/i)).not.toBeInTheDocument();
    });
  });

  describe("BLOCK disposition", () => {
    it("shows verdict badge and count without nextAction CLI text", async () => {
      fetchFirstPilotProofStatusSnapshot.mockResolvedValue(makeSnapshot("BLOCK"));

      renderWithOperatorQuery(<FirstPilotProofStatusStrip />);

      expect(await screen.findByText("BLOCK")).toBeInTheDocument();
      expect(screen.getByText(/1 block/)).toBeInTheDocument();
      expect(screen.queryByText(/dotnet run/i)).not.toBeInTheDocument();
    });
  });
});
