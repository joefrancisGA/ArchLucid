import { describe, expect, test } from "vitest";


import {

  OPERATOR_SHELL_PRESET_STORAGE_KEY,
  operatorShellPresetAllowsHref,

} from "@/lib/operator-nav-preset";


describe("operator-nav-preset", () => {


  test("storage key stays stable across sessions", () => {


    expect(OPERATOR_SHELL_PRESET_STORAGE_KEY).toBe("archlucid-nav-preset-id");
  });


  test("full preset never hides primary pilot routes", () => {


    expect(operatorShellPresetAllowsHref("full", "/evolution-review")).toBe(true);
  });


  test("pilot_operator trims advanced analysis hubs", () => {


    expect(operatorShellPresetAllowsHref("pilot_operator", "/reviews/new")).toBe(true);

    expect(operatorShellPresetAllowsHref("pilot_operator", "/replay")).toBe(false);
  });


  test("analytics_investigator keeps compare/graph but drops bare governance unless prefixed", () => {


    expect(operatorShellPresetAllowsHref("analytics_investigator", "/compare")).toBe(true);

    expect(operatorShellPresetAllowsHref("analytics_investigator", "/alerts")).toBe(false);
  });
});
