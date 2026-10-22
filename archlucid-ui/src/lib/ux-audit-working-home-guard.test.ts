import { describe, expect, it } from "vitest";

import {
  UX_AUDIT_OPERATOR_BUYER_ROUTES,
} from "../../e2e/ux-audit-route-registry";

describe("ux audit working home guard (AO-46)", () => {
  it("lists portfolio home before reviews hub in operator capture routes", () => {
    const homeRoute = UX_AUDIT_OPERATOR_BUYER_ROUTES[0];
    const reviewsRoute = UX_AUDIT_OPERATOR_BUYER_ROUTES.find((route) => route.slug === "shell-reviews-list");

    expect(homeRoute?.slug).toBe("shell-home");
    expect(homeRoute?.href).toBe("/");
    expect(reviewsRoute?.href).toBe("/architecture/reviews");
    expect(homeRoute?.href).not.toBe(reviewsRoute?.href);
  });
});
