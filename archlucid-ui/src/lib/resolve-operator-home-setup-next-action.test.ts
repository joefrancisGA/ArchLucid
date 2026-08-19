import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH,
  OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD,
  OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER,
  OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  resolveOperatorHomeSetupNextAction,
  resolveOperatorHomeSetupNextActionId,
} from "@/lib/resolve-operator-home-setup-next-action";

describe("resolveOperatorHomeSetupNextAction", () => {
  it("returns guide copy by default", () => {
    expect(resolveOperatorHomeSetupNextAction()).toBe(OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE);
    expect(resolveOperatorHomeSetupNextAction("guide")).toBe(OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE);
  });

  it("returns path, guide, cloud, and reviewer copy", () => {
    expect(resolveOperatorHomeSetupNextAction("path")).toBe(OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH);
    expect(resolveOperatorHomeSetupNextAction("cloud")).toBe(OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD);
    expect(resolveOperatorHomeSetupNextAction("reviewer")).toBe(OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER);
  });
});

describe("resolveOperatorHomeSetupNextActionId", () => {
  it("suggests choosing a create or review path before setup progress begins", () => {
    expect(resolveOperatorHomeSetupNextActionId(0, 3)).toBe("path");
  });

  it("suggests the first review guide while finish-setup steps remain incomplete", () => {
    expect(resolveOperatorHomeSetupNextActionId(2, 3)).toBe("guide");
  });

  it("suggests cloud connection after finish-setup steps are complete", () => {
    expect(resolveOperatorHomeSetupNextActionId(3, 3)).toBe("cloud");
  });
});
