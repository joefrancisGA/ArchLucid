import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ArchitectureCreateWorkItemSection } from "@/components/architecture/ArchitectureCreateWorkItemSection";

vi.mock("next/navigation", () => ({ usePathname: () => "/architecture/reviews/new" }));
vi.mock("@/components/work-items/CreateWorkItemButton", () => ({ CreateWorkItemButton: () => null }));

afterEach(() => window.history.replaceState(null, "", "/"));

it("keeps the work-item section open when a browser toggle reports its restored state", () => {
  window.history.replaceState(null, "", "/architecture/reviews/new?architectureCreateWorkItemOpen=1");
  render(
    <ArchitectureCreateWorkItemSection
      runId="review"
      architectureName="Architecture"
      architectureOverview=""
      ownerLabel={null}
      findings={[]}
    />,
  );

  const details = screen.getByTestId("architecture-create-work-item-section") as HTMLDetailsElement;
  expect(details.open).toBe(true);
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(true);
  expect(new URLSearchParams(window.location.search).get("architectureCreateWorkItemOpen")).toBe("1");

  details.open = false;
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(false);
  expect(new URLSearchParams(window.location.search).has("architectureCreateWorkItemOpen")).toBe(false);
});
