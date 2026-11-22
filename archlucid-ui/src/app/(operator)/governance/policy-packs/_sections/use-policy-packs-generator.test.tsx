import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";
import type { PolicyPacksCreatePublishSlice } from "./use-policy-packs-create-publish";
import { usePolicyPacksGenerator } from "./use-policy-packs-generator";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  search: new URLSearchParams("tab=my-packs&packId=pack-1"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.search,
}));

vi.mock("@/lib/product-line/use-policy-packs-hub-path", () => ({
  usePolicyPacksHubPath: () => "/governance/policy-packs",
}));

const deps = {
  canMutatePacks: true,
  packs: [],
  packIdFromUrl: "pack-1",
  pageTabFromUrl: "my-packs",
  pageTab: "my-packs",
  setPageTab: vi.fn(),
  load: vi.fn(),
  setLoading: vi.fn(),
  setFailure: vi.fn(),
} satisfies PolicyPacksAuthoringDeps;

const createPublish = {
  name: "",
  description: "",
  publishVersion: "1.0.0",
  packType: "ProjectCustom",
  setName: vi.fn(),
  setDescription: vi.fn(),
  setPackType: vi.fn(),
  setPublishVersion: vi.fn(),
  syncPolicyContentJson: vi.fn(),
  onCreate: vi.fn(),
} satisfies Partial<PolicyPacksCreatePublishSlice>;

describe("usePolicyPacksGenerator", () => {
  it.each([
    ["setAuthoringAdvancedOpen", "authoringAdvancedOpen", "advanced"],
    ["setAuthoringToolsOpen", "authoringToolsOpen", "tools"],
  ] as const)("replaces the URL once for %s", (setOpen, isOpen, queryKey) => {
    const { result } = renderHook(
      () => usePolicyPacksGenerator(deps, createPublish as PolicyPacksCreatePublishSlice),
      { wrapper: StrictMode },
    );

    act(() => result.current[setOpen](true));

    expect(result.current[isOpen]).toBe(true);
    expect(navigation.replace).toHaveBeenCalledExactlyOnceWith(
      `/governance/policy-packs?tab=my-packs&packId=pack-1&${queryKey}=1`,
      { scroll: false },
    );
  });
});
