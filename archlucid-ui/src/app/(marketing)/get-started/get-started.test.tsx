import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GET_STARTED_SKIP_LINK_LABEL } from "@/lib/get-started-page-copy";

import { GetStartedPageClient } from "./GetStartedPageClient";
import {
  GET_STARTED_LAST_REVIEWED_LABEL,
  GET_STARTED_PAGE_TITLE,
  GET_STARTED_SAMPLE_DISCLOSURE,
  GET_STARTED_VERTICAL_PRESENTATIONS,
} from "./get-started-content";
import { BUYER_GET_STARTED_VERTICAL_SLUGS } from "./get-started-verticals";

function readBriefSlugs(): readonly string[] {
  const briefsRoot = resolve(__dirname, "../../../../../templates/briefs");

  return readdirSync(briefsRoot)
    .filter((entry) => statSync(join(briefsRoot, entry)).isDirectory())
    .sort();
}

describe("BUYER_GET_STARTED_VERTICAL_SLUGS", () => {
  it("matches the on-disk templates/briefs/ folder slugs exactly", () => {
    const onDisk = readBriefSlugs();
    const rendered = [...BUYER_GET_STARTED_VERTICAL_SLUGS].sort();

    expect(rendered).toEqual(onDisk);
  });
});

describe("GetStartedPageClient", () => {
  it("renders distinct sample and guided-trial paths with hero proof and milestone trial CTA", () => {
    render(<GetStartedPageClient />);

    const heroHeading = screen.getByRole("heading", { name: GET_STARTED_PAGE_TITLE, level: 1 });

    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading.className).toContain("lg:text-5xl");
    expect(screen.getByTestId("get-started-hero")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-deliverable-preview")).toBeInTheDocument();
<<<<<<< HEAD
    expect(screen.getByRole("link", { name: GET_STARTED_SKIP_LINK_LABEL })).toHaveAttribute(
=======
    expect(screen.queryByTestId("get-started-hero-meta")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Skip to get started content/i })).toHaveAttribute(
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f
      "href",
      "#get-started-primary-content",
    );
    expect(screen.getByTestId("get-started-page-meta")).toHaveTextContent(GET_STARTED_LAST_REVIEWED_LABEL);
    expect(screen.getByTestId("get-started-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();
    expect(screen.getByTestId("get-started-primary-trial-cta")).toBeInTheDocument();
    expect(screen.getByTestId("get-started-sample-path")).toBeInTheDocument();
    expect(screen.getByTestId("get-started-guided-path")).toBeInTheDocument();
    expect(screen.getByTestId("get-started-choose-trial-path")).toHaveTextContent("View trial milestones");
    expect(screen.getByTestId("get-started-evaluation-signup-cta")).toHaveAttribute("href", "/signup");
  });

  it("does not expose internal template paths or promotional frictionless language", () => {
    render(<GetStartedPageClient />);

    const text = document.body.textContent ?? "";

    expect(text.toLowerCase()).not.toContain("templates/briefs");
    expect(text.toLowerCase()).not.toContain("architecture proof engine");
    expect(text.toLowerCase()).not.toContain("frictionless");
    expect(text.toLowerCase()).not.toContain("within a few seconds");
    expect(text.toLowerCase()).not.toContain("first commit");
    expect(text).not.toMatch(/Entra/i);
    expect(text).not.toMatch(/work identity/i);
    expect(text).toMatch(/one-time code/i);
    expect(text).toMatch(/No sign-in/i);
  });

  it("renders industry cards with differentiated public-sector labels and sample links", () => {
    render(<GetStartedPageClient />);

    const picker = screen.getByTestId("get-started-vertical-picker");

    expect(picker).toBeInTheDocument();
    expect(screen.getByText("Public sector")).toBeInTheDocument();
    expect(screen.getByText("US government")).toBeInTheDocument();
    expect(screen.queryByText("Public Sector (US)")).not.toBeInTheDocument();

    for (const vertical of GET_STARTED_VERTICAL_PRESENTATIONS) {
      const card = screen.getByTestId(`get-started-vertical-${vertical.slug}`);

      expect(card).toHaveAttribute("data-vertical-slug", vertical.slug);
      expect(card).toHaveAttribute("href", vertical.publicSampleHref);
      expect(card.textContent).toContain(vertical.scenario);
    }
  });

  it("renders four concise milestones with timing and sample disclosure", () => {
    render(<GetStartedPageClient />);

    for (let n = 1; n <= 4; n++) {
      expect(screen.getByTestId(`get-started-step-${n}`)).toBeInTheDocument();
      expect(screen.getByTestId(`get-started-step-${n}-indicator`)).toHaveTextContent(String(n));
    }

    expect(screen.getByText(GET_STARTED_SAMPLE_DISCLOSURE)).toBeInTheDocument();
    expect(screen.getByTestId("get-started-next-step-panel")).toBeInTheDocument();
  });

  it("does not render a talk to a human CTA", () => {
    render(<GetStartedPageClient />);

    expect(/talk to a human/i.test(document.body.textContent ?? "")).toBe(false);
  });
});

describe.sequential("GetStartedPage — NEXT_PUBLIC_DEMO_URL live demo CTA", () => {
  const originalDemoUrl = process.env.NEXT_PUBLIC_DEMO_URL;

  afterEach(() => {
    if (originalDemoUrl === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_URL;
    } else {
      process.env.NEXT_PUBLIC_DEMO_URL = originalDemoUrl;
    }
  });

  it("omits the legacy live-demo env CTA from the redesigned page", () => {
    process.env.NEXT_PUBLIC_DEMO_URL = "https://demo.archlucid.net";
    render(<GetStartedPageClient />);

    expect(screen.queryByTestId("get-started-live-demo-cta")).not.toBeInTheDocument();
  });
});

describe("docs/BUYER_FIRST_30_MINUTES.md", () => {
  it("keeps scope header, buyer/contributor split, and hosted get-started handoff (Q35 copy shipped)", () => {
    const repoRoot = resolve(__dirname, "../../../../..");
    const docPath = join(repoRoot, "docs", "BUYER_FIRST_30_MINUTES.md");
    const text = readFileSync(docPath, "utf-8");

    expect(text).toMatch(/>\s*\*\*Scope:\*\*/);
    expect(text).toContain("Audience banner:");
    expect(text).toContain("docs/engineering/FIRST_30_MINUTES.md");
    expect(text).toContain("archlucid.net/get-started");
    expect(text).not.toContain("<<placeholder copy");
  });
});
