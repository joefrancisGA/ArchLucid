import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/core-pilot",
}));

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";

describe("HelpTopicHashScroll", () => {
  afterEach(() => {
    window.location.hash = "";
    document.body.innerHTML = "";
  });

  it("opens section details before scrolling to a hash target (TB-1043)", async () => {
    const scrollIntoView = vi.fn();
    window.location.hash = "#cloud-connectors-optional";

    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.id = "cloud-connectors-optional";
    heading.scrollIntoView = scrollIntoView;
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
    });
  });
});
