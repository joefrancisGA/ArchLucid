import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExampleRoiBulletinMarketingPage from "@/app/(marketing)/example-roi-bulletin/page";
import { EXAMPLE_ROI_BULLETIN_PAGE_TITLE } from "@/components/marketing/ExampleRoiBulletinPageBody";
import {
  EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF,
  EXAMPLE_ROI_BULLETIN_TRUST_CENTER_HREF,
} from "@/lib/marketing/example-roi-bulletin-honesty";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("example-roi-bulletin marketing page", () => {
  it("uses MarketingPageShell and marketing typography (TB-1516)", () => {
    render(<ExampleRoiBulletinMarketingPage />);

    expect(screen.getByTestId("example-roi-bulletin-page")).toBeInTheDocument();
    expect(screen.getByTestId("example-roi-bulletin-body")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: EXAMPLE_ROI_BULLETIN_PAGE_TITLE, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("example-roi-bulletin-operator-disclosure")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pilot ROI model \(help\)/i })).toHaveAttribute(
      "href",
      EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF,
    );
  });

  it("ranks buyer CTAs above operator admin preview (TB-1518)", () => {
    render(<ExampleRoiBulletinMarketingPage />);

    const primaryCta = screen.getByTestId("example-roi-bulletin-primary-cta");
    const trustCta = screen.getByTestId("example-roi-bulletin-trust-center-cta");

    expect(primaryCta).toHaveAttribute("href", EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF);
    expect(trustCta).toHaveAttribute("href", EXAMPLE_ROI_BULLETIN_TRUST_CENTER_HREF);
    expect(primaryCta.getAttribute("href")).not.toContain("/api/proxy/v1/admin/roi-bulletin-preview");

    const operatorDisclosure = screen.getByTestId("example-roi-bulletin-operator-disclosure");

    expect(within(operatorDisclosure).getByTestId("example-roi-bulletin-admin-gate")).toBeInTheDocument();
    expect(operatorDisclosure.textContent).toContain("minTenants=5");
  });

  it("renders the synthetic sample as Markdown with source pre secondary (TB-1519)", () => {
    render(<ExampleRoiBulletinMarketingPage />);

    const rendered = screen.getByTestId("example-roi-bulletin-rendered-markdown");

    expect(rendered.textContent).toMatch(/SYNTHETIC EXAMPLE/i);
    expect(rendered.textContent).toMatch(/FORBIDDEN/i);
    expect(screen.getByTestId("example-roi-bulletin-source-disclosure")).toBeInTheDocument();
    expect(screen.queryByTestId("example-roi-bulletin-markdown-source")).not.toBeVisible();
  });

  it("reads the checked-in synthetic sample from docs/", () => {
    const mdPath = join(process.cwd(), "..", "docs", "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
    const md = readFileSync(mdPath, "utf8");

    expect(md).toContain("SYNTHETIC EXAMPLE");
    expect(md.split("\n")[0]).toContain("FORBIDDEN");
  });

  it("keeps admin-only preview with minTenants=5 and purges contributor paths (TB-1520)", () => {
    const pageSource = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const bodySource = readFileSync(
      join(process.cwd(), "src/components/marketing/ExampleRoiBulletinPageBody.tsx"),
      "utf8",
    );
    const honestySource = readFileSync(
      join(process.cwd(), "src/lib/marketing/example-roi-bulletin-honesty.ts"),
      "utf8",
    );

    expect(honestySource).toContain("/api/proxy/v1/admin/roi-bulletin-preview");
    expect(honestySource).toContain('params.set("minTenants", "5")');
    expect(bodySource).toContain("Admin-only");
    expect(pageSource).toContain("ExampleRoiBulletinPageBody");
    expect(pageSource).toContain("MarketingPageShell");
    expect(pageSource).not.toContain("Operator-only");
    expect(pageSource).not.toContain("docs/CLI_USAGE.md");
    expect(pageSource).toContain("index: true");
    expect(bodySource).toContain("EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF");
    expect(EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF).toBe(
      "/help/executive-summary#pilot-roi-measurement",
    );
  });

  it("exposes Markdown source inside the view-source disclosure (TB-1519)", () => {
    render(<ExampleRoiBulletinMarketingPage />);

    const disclosure = screen.getByTestId("example-roi-bulletin-source-disclosure");
    const summary = within(disclosure).getByText("View Markdown source");

    fireEvent.click(summary);

    expect(screen.getByTestId("example-roi-bulletin-markdown-source")).toBeVisible();
  });
});
