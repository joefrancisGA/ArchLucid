import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingResourcesMenu } from "@/components/marketing/MarketingResourcesMenu";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";

describe("MarketingResourcesMenu", () => {
  it("closes when another marketing nav item is selected", () => {
    render(
      <>
        <a href="/pricing#pricing-quote-request">Request demo</a>
        <MarketingResourcesMenu seeItLinked={false} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: /resources/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("link", { name: /request demo/i }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when a resource link is selected", () => {
    render(<MarketingResourcesMenu seeItLinked />);

    fireEvent.click(screen.getByRole("button", { name: /resources/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: SEE_IT_PAGE_TITLE }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
