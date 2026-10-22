import { describe, expect, it, vi } from "vitest";

import { printHelpTopicPage } from "@/lib/help/help-topic-print";

describe("printHelpTopicPage (TB-721)", () => {
  it("invokes window.print in the browser", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    printHelpTopicPage();

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });
});
