import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/operator/test",
}));

import { useBooleanSearchParamUrlSync } from "@/hooks/use-boolean-search-param-url-sync";

function disclosureHrefFromSearch(currentSearch: string, open: boolean, pathname: string): string {
  const params = new URLSearchParams(currentSearch);

  if (open) {
    params.set("panel", "1");
  } else {
    params.delete("panel");
  }

  const query = params.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function parseOpenFromSearch(raw: string | null | undefined): boolean {
  return raw === "1";
}

describe("useBooleanSearchParamUrlSync", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/operator/test");
  });

  it("commits with replaceState and dedupes rapid toggles to the same open state", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const pushState = vi.spyOn(window.history, "pushState");

    const { result } = renderHook(() =>
      useBooleanSearchParamUrlSync("panel", parseOpenFromSearch, disclosureHrefFromSearch),
    );

    const [, setOpen] = result.current;

    act(() => {
      setOpen(true);
      setOpen(true);
    });

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();

    replaceState.mockRestore();
    pushState.mockRestore();
  });

  it("syncs open state from popstate without pushing history entries", () => {
    const pushState = vi.spyOn(window.history, "pushState");

    window.history.replaceState(null, "", "/operator/test?panel=1");

    const { result } = renderHook(() =>
      useBooleanSearchParamUrlSync("panel", parseOpenFromSearch, disclosureHrefFromSearch),
    );

    expect(result.current[0]).toBe(true);

    act(() => {
      window.history.replaceState(null, "", "/operator/test?panel=0");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toBe(false);
    expect(pushState).not.toHaveBeenCalled();

    pushState.mockRestore();
  });
});