import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecurityProductHome } from "@/components/product-line/SecurityProductHome";
import { SECURITY_PRODUCT_HOME_TITLE } from "@/lib/product-line/product-line-copy";

describe("SecurityProductHome", () => {
  it("shows the home header without product-shell selection or sidebar destinations", () => {
    render(<SecurityProductHome />);

    expect(screen.getByTestId("security-product-home")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURITY_PRODUCT_HOME_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("product-line-switch-bar")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Infrastructure overview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Remediation factory/i })).not.toBeInTheDocument();
  });
});
