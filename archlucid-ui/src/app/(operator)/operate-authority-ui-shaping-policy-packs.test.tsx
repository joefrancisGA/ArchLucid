import "./operate-authority-ui-shaping.setup.tsx";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  policyPacksCreatePackButtonLabelReaderRank,
  policyPacksCurrentPacksHeadingOperator,
  policyPacksCurrentPacksHeadingReader,
  policyPacksPackContentHeadingReader,
} from "@/lib/enterprise-controls-context-copy";

import { mutateCapability } from "./operate-authority-ui-shaping.fixtures";
import {
  expandPolicyPacksAdvancedOptions,
  expandPolicyPacksAuthoringTools,
} from "./operate-authority-ui-shaping.setup";
import PolicyPacksPage from "./governance/policy-packs/page";

describe("Enterprise authority UI shaping — policy packs", () => {
  it(
    "Policy packs: Author rules tab surfaces the rule authoring wizard",
    async () => {
      mutateCapability.current = true;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Authoring and generation tools$/ })).toBeInTheDocument();
      });

      await expandPolicyPacksAuthoringTools();
      fireEvent.click(screen.getByTestId("policy-packs-tab-author"));

      await waitFor(() => {
        expect(screen.getByTestId("policy-packs-author-tab")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId("policy-rule-authoring-wizard")).toBeInTheDocument();
      });
    },
    15_000,
  );

  it(
    "Policy packs: Create pack stays disabled when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingReader })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: policyPacksCreatePackButtonLabelReaderRank })).toBeDisabled();
      });
    },
    15_000,
  );

  it(
    "Policy packs: inventory headings show inspect framing when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingReader })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      expect(screen.getByRole("heading", { name: policyPacksPackContentHeadingReader })).toBeInTheDocument();
    },
    15_000,
  );

  it(
    "Policy packs: Create pack enables after load when mutation capability is true",
    async () => {
      mutateCapability.current = true;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingOperator })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create pack/i })).not.toBeDisabled();
      });
    },
    15_000,
  );
});
