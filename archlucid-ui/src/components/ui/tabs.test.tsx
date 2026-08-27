import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isTabsKeyboardMove, resolveNextTabIndex } from "@/components/ui/tabs-keyboard";

describe("tabs-keyboard", () => {
  it("wraps horizontally with ArrowRight and ArrowLeft", () => {
    expect(resolveNextTabIndex(0, 3, "ArrowLeft", "horizontal")).toBe(2);
    expect(resolveNextTabIndex(2, 3, "ArrowRight", "horizontal")).toBe(0);
  });

  it("moves to first and last with Home and End", () => {
    expect(resolveNextTabIndex(1, 3, "Home", "horizontal")).toBe(0);
    expect(resolveNextTabIndex(1, 3, "End", "horizontal")).toBe(2);
  });

  it("recognizes keyboard move keys", () => {
    expect(isTabsKeyboardMove("ArrowRight")).toBe(true);
    expect(isTabsKeyboardMove("Enter")).toBe(false);
  });
});

function renderThreeTabFixture(
  props?: Partial<ComponentProps<typeof Tabs>>,
): ReturnType<typeof render> {
  return render(
    <Tabs defaultValue="a" {...props}>
      <TabsList aria-label="Example sections">
        <TabsTrigger value="a">Tab A</TabsTrigger>
        <TabsTrigger value="b">Tab B</TabsTrigger>
        <TabsTrigger value="c">Tab C</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
      <TabsContent value="c">Panel C</TabsContent>
    </Tabs>,
  );
}

describe("Tabs primitive (TB-665)", () => {
  it("renders tablist with aria-selected on the active trigger", () => {
    renderThreeTabFixture();

    const tabA = screen.getByRole("tab", { name: "Tab A" });
    const tabB = screen.getByRole("tab", { name: "Tab B" });

    expect(tabA).toHaveAttribute("aria-selected", "true");
    expect(tabB).toHaveAttribute("aria-selected", "false");
    expect(tabA).toHaveAttribute("aria-controls");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel A");
  });

  it("activates a tab on click and shows the matching tabpanel", () => {
    renderThreeTabFixture();

    fireEvent.click(screen.getByRole("tab", { name: "Tab B" }));

    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel B");
  });

  it("moves selection with ArrowRight keyboard navigation", () => {
    renderThreeTabFixture();

    const tabA = screen.getByRole("tab", { name: "Tab A" });
    tabA.focus();

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel B");
  });

  it("hides inactive tabpanels from layout", () => {
    renderThreeTabFixture();

    fireEvent.click(screen.getByRole("tab", { name: "Tab C" }));

    expect(screen.queryByText("Panel A")).toBeNull();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel C");
  });

  it("syncs ?tab= to the URL when syncUrlParam is enabled", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    window.history.pushState({}, "", "/example");

    renderThreeTabFixture({ syncUrlParam: "tab" });

    fireEvent.click(screen.getByRole("tab", { name: "Tab B" }));

    expect(replaceState).toHaveBeenCalled();
    const lastCall = replaceState.mock.calls.at(-1);
    expect(String(lastCall?.[2])).toContain("tab=b");
  });

  it("renders line variant triggers with semibold button label scale (TB-2290)", () => {
    renderThreeTabFixture();

    const tabA = screen.getByRole("tab", { name: "Tab A" });

    expect(tabA.className).toContain("font-semibold");
    expect(tabA.className).toContain("text-[13px]");
    expect(tabA.className).not.toContain("font-normal");
  });

  it("renders line variant triggers with underline styling by default (TB-1665)", () => {
    renderThreeTabFixture();

    const tabA = screen.getByRole("tab", { name: "Tab A" });

    expect(tabA.className).toMatch(/border-b-2/);
    expect(tabA.className).not.toMatch(/rounded-full/);
  });

  it("still renders pill chrome when a call site explicitly opts in", () => {
    render(
      <Tabs defaultValue="a" variant="pill">
        <TabsList aria-label="Example sections">
          <TabsTrigger value="a">Tab A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
      </Tabs>,
    );

    const tabA = screen.getByRole("tab", { name: "Tab A" });

    expect(tabA.className).toMatch(/rounded-full/);
    expect(tabA.className).not.toMatch(/border-b-2/);
  });

  it("renders line variant triggers with underline styling when variant is line", () => {
    render(
      <Tabs defaultValue="a" variant="line">
        <TabsList aria-label="Example sections">
          <TabsTrigger value="a">Tab A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
      </Tabs>,
    );

    const tabA = screen.getByRole("tab", { name: "Tab A" });

    expect(tabA.className).toMatch(/border-b-2/);
    expect(tabA.className).not.toMatch(/rounded-full/);
  });
});
