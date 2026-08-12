import { describe, expect, it } from "vitest";

import { formatIdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";

describe("identity-providers-fetch-note", () => {
  it("formats optional HTTP status codes for diagnostics surfaces", () => {
    expect(formatIdentityProvidersFetchNote({ message: "Catalog unavailable", statusCode: 404 })).toBe(
      "Catalog unavailable (HTTP 404).",
    );
    expect(formatIdentityProvidersFetchNote({ message: "Network error" })).toBe("Network error");
  });
});
