import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";
import DecisionRegisterClient from "./DecisionRegisterClient";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("@/lib/operator/operator-resource-scope", () => ({
  projectIdFromScopeHeaders: () => "default",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { getArchitectureDecisionRegister } from "@/lib/api/governance-stickiness-api";

const searchParamsState = vi.hoisted(() => ({ query: "" }));
const routerReplace = vi.hoisted(() => vi.fn());
const searchParamsListeners = vi.hoisted(() => new Set<() => void>());

function notifySearchParamsListeners(): void {
  for (const listener of searchParamsListeners) {
    listener();
  }
}

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: (href: string) => {
        routerReplace(href);
        const url = new URL(href, "http://localhost");
        searchParamsState.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
        notifySearchParamsListeners();
      },
      back: vi.fn(),
    }),
    usePathname: () => "/governance/decision-register",
    useSearchParams: () => new URLSearchParams(searchParamsState.query),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

function DecisionRegisterSearchParamsHost({ children }: { readonly children: ReactNode }): ReactElement {
  useSyncExternalStore(
    (listener) => {
      searchParamsListeners.add(listener);

      return () => {
        searchParamsListeners.delete(listener);
      };
    },
    () => searchParamsState.query,
    () => "",
  );

  return <>{children}</>;
}

function renderDecisionRegisterClient(): ReturnType<typeof render> {
  return render(
    <DecisionRegisterSearchParamsHost>
      <DecisionRegisterClient />
    </DecisionRegisterSearchParamsHost>,
  );
}

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "", runId: "" }),
}));

const mockedGetRegister = vi.mocked(getArchitectureDecisionRegister);

describe("DecisionRegisterClient view switcher", () => {
  beforeEach(() => {
    searchParamsState.query = "";
    routerReplace.mockClear();
    mockedGetRegister.mockReset();
    mockedGetRegister.mockResolvedValue({ decisions: [] });
  });


  it("renders the governance job router chooser at the top (TB-2199 / TB-2230)", async () => {
    renderDecisionRegisterClient();

    const strip = await screen.findByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "record-decisions");
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "href",
      "/governance/findings",
    );
  });

  it("switches empty-state chrome between cards and timeline", async () => {
    renderDecisionRegisterClient();

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByTestId("decision-register-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("decision-register-timeline-panel")).not.toBeInTheDocument();

    const cardsLink = screen.getByRole("link", { name: DECISION_REGISTER_VIEW_CARDS_LABEL });
    const timelineLink = screen.getByRole("link", { name: DECISION_REGISTER_VIEW_TIMELINE_LABEL });

    expect(cardsLink).toHaveAttribute("aria-current", "page");
    expect(timelineLink).not.toHaveAttribute("aria-current");
    expect(timelineLink).toHaveAttribute("href", "/governance/decision-register?view=timeline");

    searchParamsState.query = "view=timeline";
    cleanup();
    renderDecisionRegisterClient();

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-timeline-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("decision-register-view-timeline")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("decision-register-view-cards")).not.toHaveAttribute("aria-current");
    expect(screen.queryByTestId("decision-register-cards")).not.toBeInTheDocument();
    expect(screen.getByTestId("decision-register-empty-state")).toBeInTheDocument();
  });

  it("shows pick review strip before filtering when runId is not scoped", async () => {
    renderDecisionRegisterClient();

    await waitFor(() => {
      expect(screen.getByTestId("decision-register-pick-review-before-filtering-strip")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("decision-register-filters")).not.toBeInTheDocument();
  });
});
