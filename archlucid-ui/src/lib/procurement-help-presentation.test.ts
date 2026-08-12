import { describe, expect, it } from "vitest";

import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { rewriteProcurementFaqBuyerPresentation } from "@/lib/procurement-help-presentation";
import {
  PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF,
  PROCUREMENT_HELP_NDA_REQUEST_HREF,
  PROCUREMENT_HELP_SALES_CONTACT_HREF,
} from "@/lib/procurement-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const PROCUREMENT_SOURCE = "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md";

describe("procurement-help-presentation", () => {
  it("rewrites dead-end diligence phrases to in-app destinations", () => {
    const source = [
      "Request current SLA summary language through security / sales.",
      "Request MSA / Order Form language through legal / sales diligence.",
      "distributed under NDA through security / sales diligence",
      "directly from Vendor during diligence",
      "coordinated via sales",
      "ask sales for the current reference posture",
      "request Enterprise terms through sales",
      "or use `/pricing?interest=custom-policy-pack#pricing-quote-request`",
    ].join("\n");

    const prepared = rewriteProcurementFaqBuyerPresentation(source);

    expect(prepared).toContain(PROCUREMENT_HELP_NDA_REQUEST_HREF);
    expect(prepared).toContain(PROCUREMENT_HELP_SALES_CONTACT_HREF);
    expect(prepared).toContain(PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF);
    expect(prepared).not.toMatch(/through security \/ sales/i);
    expect(prepared).not.toMatch(/through legal \/ sales/i);
    expect(prepared).not.toMatch(/`\/pricing\?/);
    expect(prepared).not.toMatch(/\bVendor\b/);
  });

  it("keeps loaded procurement FAQ buyer-safe after full presentation pipeline", () => {
    const loaded = tryLoadProductDocumentation("procurement");

    expect(loaded).not.toBeNull();

    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, PROCUREMENT_SOURCE, {
      helpTopicSlug: "procurement",
    });

    expect(prepared).toContain(PROCUREMENT_HELP_NDA_REQUEST_HREF);
    expect(prepared).toContain(PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF);
    expect(prepared).not.toMatch(/\bVendor\b/);
    expect(prepared).not.toMatch(/`\/pricing\?/);
  });
});
