import { describe, expect, it } from "vitest";

import {
  ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_HREF,
  ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_LINK_LABEL,
  ADMIN_DIAGNOSTICS_INBOUND_SECTION_TITLE,
} from "@/lib/admin-diagnostics-inbound-copy";
import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-evidence-copy";

describe("admin diagnostics inbound copy (TB-1613)", () => {
  it("aligns inbound section title with specialty help page title", () => {
    expect(ADMIN_DIAGNOSTICS_INBOUND_SECTION_TITLE).toBe(ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE);
  });

  it("routes inbound guidance to the admin-diagnostics help slug", () => {
    expect(ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_HREF).toBe("/help/admin-diagnostics");
  });

  it("uses buyer-facing inbound link label aligned with Help search chrome", () => {
    expect(ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_LINK_LABEL).toBe("Open the Admin diagnostics guide");
    expect(ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_LINK_LABEL.toLowerCase()).not.toBe("open admin diagnostics");
  });
});
