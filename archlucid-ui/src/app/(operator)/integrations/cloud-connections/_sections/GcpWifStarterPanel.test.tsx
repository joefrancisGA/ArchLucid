import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GcpWifStarterPanel } from "./GcpWifStarterPanel";

const TENANT_ID = "11111111-2222-3333-4444-555555555555";
const MANAGED_IDENTITY_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("GcpWifStarterPanel (P0-3, P0-6)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows needs-attention tags and no brace placeholders when federation config is unresolved", () => {
    render(<GcpWifStarterPanel />);

    expect(screen.getByTestId("gcp-wif-starter-unresolved-issuer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Token audience" })).toBeInTheDocument();
    expect(screen.getByTestId("gcp-wif-starter-unresolved-subject")).toBeInTheDocument();
    expect(screen.getByTestId("gcp-wif-starter-identifier-issuer")).not.toHaveTextContent("{ArchLucid");
    expect(screen.queryByLabelText(/Copy OIDC issuer/i)).not.toBeInTheDocument();
  });

  it("renders resolved federation values with per-row copy controls", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", TENANT_ID);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", MANAGED_IDENTITY_ID);

    render(<GcpWifStarterPanel />);

    expect(screen.getByTestId("gcp-wif-starter-identifier-issuer")).toHaveTextContent(
      `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
    );
    expect(screen.getByTestId("gcp-wif-starter-identifier-subject")).toHaveTextContent(MANAGED_IDENTITY_ID);
    expect(screen.queryByTestId("gcp-wif-starter-unresolved-issuer")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Copy OIDC issuer (Entra ID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Copy Subject (managed identity object ID)")).toBeInTheDocument();
  });

  it("copies a resolved federation identifier row", async () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", TENANT_ID);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", MANAGED_IDENTITY_ID);

    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<GcpWifStarterPanel />);

    fireEvent.click(screen.getByLabelText("Copy Subject (managed identity object ID)"));

    expect(writeText).toHaveBeenCalledWith(MANAGED_IDENTITY_ID);
  });
});
