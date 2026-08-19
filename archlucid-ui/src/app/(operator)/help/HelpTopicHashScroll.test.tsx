import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/first-architecture-review",
}));

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";

describe("HelpTopicHashScroll", () => {
  afterEach(() => {
    window.location.hash = "";
    document.body.innerHTML = "";
  });

  it("opens section details and moves focus before scrolling to a hash target (TB-1043)", async () => {
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    window.location.hash = "#cloud-connectors-optional";

    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.id = "cloud-connectors-optional";
    heading.scrollIntoView = scrollIntoView;
    heading.focus = focus;
    const details = document.createElement("details");
    details.open = false;
    details.appendChild(document.createElement("summary"));
    section.appendChild(heading);
    section.appendChild(details);
    document.body.appendChild(section);

    render(<HelpTopicHashScroll />);

    await vi.waitFor(() => {
      expect(details.open).toBe(true);
      expect(scrollIntoView).toHaveBeenCalled();
      expect(heading.getAttribute("tabindex")).toBe("-1");
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });
  });
});
