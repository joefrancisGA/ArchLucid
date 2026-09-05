import { describe, expect, it, vi } from "vitest";

import { replaceIfHrefChanged } from "@/lib/navigation/replace-if-href-changed";

describe("replaceIfHrefChanged", () => {
  it("skips replace when the href already matches the current location", () => {
    const replace = vi.fn();
    const currentHref = `${window.location.pathname}${window.location.search}`;

    replaceIfHrefChanged({ replace }, currentHref);

    expect(replace).not.toHaveBeenCalled();
  });

  it("skips replace when the href is empty", () => {
    const replace = vi.fn();

    replaceIfHrefChanged({ replace }, "");

    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces when the href differs from the current location", () => {
    const replace = vi.fn();

    replaceIfHrefChanged({ replace }, "/architecture/reviews");

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/architecture/reviews", { scroll: false });
  });
});
