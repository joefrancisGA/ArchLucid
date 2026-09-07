import { describe, expect, it } from "vitest";

import {
  howProductWorksHelpSourceLink,
  localizeHelpSearchPanelTopic,
  newToProductHelpCollapsedSummary,
} from "@/lib/help/help-product-copy";
import type { HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";

describe("help-product-copy", () => {
  it("builds SecureNow how-it-works source links", () => {
    expect(howProductWorksHelpSourceLink("security")).toEqual({
      label: "How SecureNow works",
      href: "/help/getting-started#how-archlucid-works",
    });
    expect(howProductWorksHelpSourceLink("architecture")).toEqual({
      label: "How ArchLucid works",
      href: "/help/getting-started#how-archlucid-works",
    });
  });

  it("localizes collapsed start-here summary for SecureNow", () => {
    expect(newToProductHelpCollapsedSummary("security")).toBe("New to SecureNow?");
    expect(newToProductHelpCollapsedSummary("architecture")).toBe("New to ArchLucid?");
  });

  it("localizes help search topics for SecureNow", () => {
    const topic: HelpSearchPanelTopic = {
      id: "how-archlucid-works",
      title: "How ArchLucid works",
      description: "Learn how ArchLucid turns architecture evidence into review findings.",
      keywords: [],
      action: { kind: "route", href: "/help/getting-started#how-archlucid-works", helpSlug: "getting-started" },
    };

    const localized = localizeHelpSearchPanelTopic(topic, "security");

    expect(localized.title).toBe("How SecureNow works");
    expect(localized.description).toContain("SecureNow");
    expect(localized.description).not.toContain("ArchLucid");
  });
});
