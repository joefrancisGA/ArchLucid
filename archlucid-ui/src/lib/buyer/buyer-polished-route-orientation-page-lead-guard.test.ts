import { describe, expect, it } from "vitest";

import { buyerPolishedRouteOrientation } from "@/lib/buyer/buyer-polished-route-orientation";
import { BUYER_POLISHED_ROUTE_PAGE_LEAD_INVENTORY } from "@/lib/buyer/buyer-polished-route-orientation-page-lead-inventory";

describe("buyerPolishedRouteOrientation page-lead inventory guard (TB-1440)", () => {
  it.each(BUYER_POLISHED_ROUTE_PAGE_LEAD_INVENTORY)(
    "$route — orientation is null (OperatorPageHeader owns the lead)",
    ({ route, options }) => {
      expect(buyerPolishedRouteOrientation(route, options)).toBeNull();
    },
  );

  it.each(BUYER_POLISHED_ROUTE_PAGE_LEAD_INVENTORY)(
    "$route — strip line must not equal OperatorPageHeader lead constant",
    ({ route, operatorPageLead, options }) => {
      const orientation = buyerPolishedRouteOrientation(route, options);

      if (orientation === null) {
        return;
      }

      expect(orientation.line).not.toBe(operatorPageLead);
    },
  );
});
