import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExampleRoiBulletinMarketingPage from "@/app/(marketing)/example-roi-bulletin/page";
import { EXAMPLE_ROI_BULLETIN_PAGE_TITLE } from "@/components/marketing/ExampleRoiBulletinPageBody";
import { EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF } from "@/lib/marketing/example-roi-bulletin-honesty";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("example-roi-bulletin marketing page", () => {
  it("uses MarketingPageShell and marketing typography (TB-1516)", () => {
    render(<ExampleRoiBulletinMarketingPage />);

    expect(screen.getByTestId("example-roi-bulletin-page")).toBeInTheDocument();
    expect(screen.getByTestId("example-roi-bulletin-body")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: EXAMPLE_ROI_BULLETIN_PAGE_TITLE, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("example-roi-bulletin-admin-gate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pilot ROI model \(help\)/i })).toHaveAttribute(
      "href",
      EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF,
    );
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
    expect(pageSource).toContain("index: false");
    expect(bodySource).toContain("EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF");
    expect(EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF).toBe(
      "/help/executive-summary#pilot-roi-measurement",
    );
  });
});
