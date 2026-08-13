import { render, screen } from "@testing-library/react";
import { forwardRef, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ArchitecturesHubHeaderActions } from "@/app/(operator)/architecture/architectures/_sections/ArchitecturesHubHeaderActions";
import { ReviewsHubHeaderActions } from "@/app/(operator)/architecture/reviews/_sections/ReviewsHubHeaderActions";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_PRIMARY_CTA_INVENTORY } from "@/lib/operator/operator-primary-cta-inventory";

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: vi.fn(),
    isNavigating: false,
    loadingLabel: "Opening…",
  }),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Help</button>,
}));

vi.mock("next/link", () => ({
  default: forwardRef<HTMLAnchorElement, { readonly href: string; readonly children: ReactNode }>(
    function MockLink({ href, children, ...rest }, ref) {
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      );
    },
  ),
}));

/** Arbitrary-value Tailwind class the Button variant system applies to primary actions. */
const PRIMARY_ACTION_CLASS = "bg-[var(--al-primary-action-bg)]";

const ORDINAL_STEP_PREFIX = /^Step\s*\d/i;

/** Words that rank one path above the other — banned by ADR 0067 decision point 2. */
const RANKING_LANGUAGE = /one lifecycle|durable work item/i;

function classTokens(className: string): readonly string[] {
  return className.split(/\s+/).filter((token) => token.length > 0);
}

/** Class tokens a `variant="primary" size="sm"` Button emits — the parity reference. */
function primaryReferenceTokens(): readonly string[] {
  const { container, unmount } = render(
    <Button variant="primary" size="sm">
      Reference
    </Button>,
  );
  const reference = container.querySelector("button");

  expect(reference).not.toBeNull();
  const tokens = classTokens(reference?.className ?? "");
  unmount();

  return tokens;
}

/** Counts primary actions by class token — the marker is an arbitrary-value class, not a plain selector. */
function countPrimaryActions(container: HTMLElement): number {
  return Array.from(container.querySelectorAll("a, button")).filter((element) =>
    classTokens(element.className).includes(PRIMARY_ACTION_CLASS),
  ).length;
}

/**
 * ADR 0067 — Create architecture and Review are co-equal entry points.
 * Supersedes the former `buyer-polish-copy-home-lifecycle` guard, which asserted the
 * opposite contract (`Step 1` / `Step 2` prefixes and a `One lifecycle` lead).
 */
describe("ADR 0067 — Create architecture / Review peer parity", () => {
  it("keeps ordinal and funnel framing off the pair", () => {
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE).not.toMatch(ORDINAL_STEP_PREFIX);
    expect(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE).not.toMatch(ORDINAL_STEP_PREFIX);
    expect(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO).not.toMatch(RANKING_LANGUAGE);
    expect(OPERATOR_HOME_INTENT_CHOOSER_HEADING).not.toMatch(ORDINAL_STEP_PREFIX);
    expect(OPERATOR_HOME_INTENT_CHOOSER_HEADING).not.toMatch(/lifecycle/i);
    expect(OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH).not.toMatch(/lifecycle/i);
  });

  it("names both jobs in the chooser heading so neither is implied to come first", () => {
    expect(OPERATOR_HOME_INTENT_CHOOSER_HEADING).toMatch(/create/i);
    expect(OPERATOR_HOME_INTENT_CHOOSER_HEADING).toMatch(/review/i);
    expect(OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH).toMatch(/create/i);
    expect(OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH).toMatch(/review/i);
  });

  it("gives the two card titles parallel grammar — same shape, different verb", () => {
    const [createVerb, ...createRest] = OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE.split(" ");
    const [reviewVerb, ...reviewRest] = OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE.split(" ");

    expect(createVerb).not.toBe(reviewVerb);
    expect(createRest.join(" ")).toBe(reviewRest.join(" "));
  });

  it("makes each card state its own outcome instead of the other path's absence", () => {
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY).toContain("It produces");
    expect(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY).toContain("It produces");
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY).not.toMatch(/does not start a review/i);
  });

  it("keeps artifact standing distinct — parity of entry points, not of artifacts", () => {
    // ADR 0067 decision point 5: a draft is mutable and unsigned; only review yields a signed record.
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY).toMatch(/draft/i);
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY).not.toMatch(/signed/i);
    expect(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY).toMatch(/signed review record/i);
  });

  it("audits both hub primaries in lockstep in the CTA inventory", () => {
    const createEntry = OPERATOR_PRIMARY_CTA_INVENTORY.find((entry) => entry.id === "architectures-list");
    const reviewEntry = OPERATOR_PRIMARY_CTA_INVENTORY.find((entry) => entry.id === "reviews-hub");

    expect(createEntry).toBeDefined();
    expect(reviewEntry).toBeDefined();
    expect(createEntry?.status).toBe("verified");
    expect(reviewEntry?.status).toBe(createEntry?.status);
  });

  it("renders both hub primaries at equal weight with one primary per hub", () => {
    const referenceTokens = primaryReferenceTokens();

    const createHub = render(<ArchitecturesHubHeaderActions />);
    const createTokens = classTokens(screen.getByTestId("architectures-page-create").className);

    expect(countPrimaryActions(createHub.container)).toBe(1);
    createHub.unmount();

    const reviewHub = render(<ReviewsHubHeaderActions />);
    const reviewTokens = classTokens(screen.getByTestId("runs-page-start-review").className);

    expect(countPrimaryActions(reviewHub.container)).toBe(1);
    reviewHub.unmount();

    // Equal weight: both carry every class the shared primary/sm reference emits.
    for (const token of referenceTokens) {
      expect(createTokens).toContain(token);
      expect(reviewTokens).toContain(token);
    }
  });
});
