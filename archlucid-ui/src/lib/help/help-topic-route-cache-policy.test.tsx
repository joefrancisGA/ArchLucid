import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HelpTopicLoading from "@/app/(operator)/help/[...topic]/loading";
import { HelpTopicPageLoadingSkeleton } from "@/components/skeletons/HelpTopicPageLoadingSkeleton";
import {
  HELP_TOPIC_LAYOUT_DYNAMIC,
  HELP_TOPIC_ROUTE_REVALIDATE_SECONDS,
} from "@/lib/help/help-topic-route-cache-policy";

const HELP_TOPIC_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

const HELP_LAYOUT_PATH = join(process.cwd(), "src", "app", "(operator)", "help", "layout.tsx");

describe("HelpTopicPageLoadingSkeleton TB-1600", () => {
  it("renders shell-standard loading placeholders", () => {
    render(<HelpTopicPageLoadingSkeleton />);

    expect(screen.getByTestId("help-topic-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("help-topic-loading-title")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-loading-body")).toBeInTheDocument();
  });

  it("exports route loading segment that reuses the shared skeleton", () => {
    render(<HelpTopicLoading />);

    expect(screen.getByTestId("help-topic-loading")).toBeInTheDocument();
  });
});

describe("help-topic-route-cache-policy TB-1600", () => {
  it("documents ISR revalidate for buyer topics", () => {
    expect(HELP_TOPIC_ROUTE_REVALIDATE_SECONDS).toBe(3600);
  });

  it("keeps help layout static while page uses ISR instead of force-dynamic", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE_PATH, "utf8");
    const layoutSource = readFileSync(HELP_LAYOUT_PATH, "utf8");

    expect(pageSource).toContain("export const revalidate = 3600");
    expect(pageSource).toContain("HELP_TOPIC_ROUTE_REVALIDATE_SECONDS");
    expect(pageSource).not.toContain('dynamic = "force-dynamic"');
    expect(pageSource).toContain("generateStaticParams");
    expect(layoutSource).toContain(`dynamic = "${HELP_TOPIC_LAYOUT_DYNAMIC}"`);
  });
});
