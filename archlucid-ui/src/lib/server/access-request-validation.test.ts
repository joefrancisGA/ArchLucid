import { describe, expect, it } from "vitest";

import { parseAccessRequestBody } from "@/lib/server/access-request-validation";

describe("parseAccessRequestBody", () => {
  it("accepts a valid work-email access request", () => {
    const result = parseAccessRequestBody({
      name: "Alex Rivera",
      workEmail: "alex@contoso.com",
      company: "Contoso",
      roleTitle: "Principal architect",
      cloudPlatformFocus: "Azure",
      note: "Piloting approval reviews",
      websiteUrl: "",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.workEmail).toBe("alex@contoso.com");
      expect(result.value.cloudPlatformFocus).toBe("Azure");
    }
  });

  it("rejects personal email domains", () => {
    const result = parseAccessRequestBody({
      name: "Alex Rivera",
      workEmail: "alex@gmail.com",
      company: "Contoso",
      roleTitle: "Architect",
      websiteUrl: "",
    });

    expect(result.ok).toBe(false);
  });

  it("treats honeypot submissions as valid payloads for silent acceptance", () => {
    const result = parseAccessRequestBody({
      name: "Bot",
      workEmail: "bot@contoso.com",
      company: "Contoso",
      roleTitle: "Architect",
      websiteUrl: "https://spam.example",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.websiteUrl).toBe("https://spam.example");
    }
  });
});
