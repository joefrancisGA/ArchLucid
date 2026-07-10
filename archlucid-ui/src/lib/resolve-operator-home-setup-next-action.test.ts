import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD,
  OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER,
  OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE,
} from "@/lib/buyer-polish-copy";
import {
  resolveOperatorHomeSetupNextAction,
  resolveOperatorHomeSetupNextActionId,
} from "@/lib/resolve-operator-home-setup-next-action";

describe("resolveOperatorHomeSetupNextAction", () => {
  it("returns guide copy by default", () => {
    expect(resolveOperatorHomeSetupNextAction()).toBe(OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE);
    expect(resolveOperatorHomeSetupNextAction("guide")).toBe(OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE);
  });

  it("returns cloud and reviewer copy for optional setup paths", () => {
    expect(resolveOperatorHomeSetupNextAction("cloud")).toBe(OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD);
    expect(resolveOperatorHomeSetupNextAction("reviewer")).toBe(OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER);
  });
});

describe("resolveOperatorHomeSetupNextActionId", () => {
  it("suggests the first review guide until finish-setup steps are complete", () => {
    expect(resolveOperatorHomeSetupNextActionId(0, 3)).toBe("guide");
    expect(resolveOperatorHomeSetupNextActionId(2, 3)).toBe("guide");
  });

  it("suggests cloud connection after finish-setup steps are complete", () => {
    expect(resolveOperatorHomeSetupNextActionId(3, 3)).toBe("cloud");
  });
});
