import { describe, expect, it } from "vitest";

import { AUTH_BOOTSTRAP_PAGE_DESCRIPTION } from "@/lib/auth/auth-bootstrap-page-copy";
import {
  POST_AUTH_BOOTSTRAP_DESTINATION_ORDER_SUMMARY,
  POST_AUTH_BOOTSTRAP_INVITATION_JOINED_BODY,
} from "@/lib/auth/post-auth-bootstrap-destination-order-copy";
import { POST_AUTH_BOOTSTRAP_COPY } from "@/lib/auth/post-auth-bootstrap-denial-copy";
import { CREATE_WORKSPACE_COPY } from "@/lib/auth/create-workspace-schema";

describe("live-seat post-auth bootstrap copy (LS-004, LS-005, LS-008, LS-016)", () => {
  it("names invitation-first destination order", () => {
    expect(AUTH_BOOTSTRAP_PAGE_DESCRIPTION).toMatch(/invitation/i);
    expect(AUTH_BOOTSTRAP_PAGE_DESCRIPTION).toMatch(/create/i);
    expect(POST_AUTH_BOOTSTRAP_DESTINATION_ORDER_SUMMARY).toMatch(/invitation/i);
  });

  it("describes live workspace on invite accept", () => {
    expect(POST_AUTH_BOOTSTRAP_INVITATION_JOINED_BODY).toMatch(/tenant data/i);
    expect(POST_AUTH_BOOTSTRAP_INVITATION_JOINED_BODY).not.toMatch(/Customer Intake Demo.*your tenant/i);
  });

  it("create workspace lead stresses live data not Training", () => {
    expect(CREATE_WORKSPACE_COPY.lead).toMatch(/live tenant data/i);
    expect(CREATE_WORKSPACE_COPY.lead).toMatch(/invitation/i);
  });

  it("select workspace copy targets invited memberships", () => {
    expect(POST_AUTH_BOOTSTRAP_COPY.selectWorkspaceLead).toMatch(/workspace you want/i);
  });
});
