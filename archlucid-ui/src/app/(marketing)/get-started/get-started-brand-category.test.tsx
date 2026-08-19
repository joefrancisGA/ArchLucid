import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GetStartedPage from "./page";
import { GET_STARTED_PAGE_TITLE } from "./get-started-content";

describe("GetStartedPage shell", () => {
  it("renders the redesigned onboarding title in the page shell", () => {
    render(<GetStartedPage />);

    expect(screen.getByTestId("get-started-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: GET_STARTED_PAGE_TITLE, level: 1 })).toBeInTheDocument();
  });
});
