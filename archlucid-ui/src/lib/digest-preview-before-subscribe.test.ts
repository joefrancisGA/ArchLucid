import { describe, expect, it } from "vitest";

import {
  buildDigestPreviewBeforeSubscribeSpecimen,
  DIGEST_PREVIEW_ARCHITECTURE_SECTIONS,
  DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE,
  DIGEST_PREVIEW_SPONSOR_SECTIONS,
  DIGEST_PREVIEW_SEND_TO_ME_LABEL,
  DIGEST_PREVIEW_SEND_TO_ME_UNAVAILABLE_REASON,
  isDigestPreviewSendToMeAvailable,
  resolveDigestPreviewHelper,
} from "@/lib/digest-preview-before-subscribe";
import { DIGESTS_BROWSE_INCLUDES_ITEMS } from "@/lib/digests-browse-copy";

describe("digest-preview-before-subscribe (TB-2211)", () => {
  it("exposes stable title and send-to-me CTA labels", () => {
    expect(DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE).toBe("Preview before you subscribe");
    expect(DIGEST_PREVIEW_SEND_TO_ME_LABEL).toBe("Send preview to me");
    expect(DIGEST_PREVIEW_SEND_TO_ME_UNAVAILABLE_REASON.length).toBeGreaterThan(20);
    expect(isDigestPreviewSendToMeAvailable()).toBe(false);
  });

  it("reuses Browse includes items for architecture specimen sections", () => {
    expect(DIGEST_PREVIEW_ARCHITECTURE_SECTIONS).toEqual([...DIGESTS_BROWSE_INCLUDES_ITEMS]);
  });

  it("builds architecture subscription specimen from form fields", () => {
    const specimen = buildDigestPreviewBeforeSubscribeSpecimen({
      variant: "architecture-subscription",
      subscriptionName: "Ops mailbox",
      channelType: "Email",
      destination: "ops@example.com",
      digestTypeLabel: "Architecture digest",
    });

    expect(specimen.subjectLine).toBe("Architecture digest");
    expect(specimen.toLine).toBe("ops@example.com");
    expect(specimen.metaLine).toContain("Email");
    expect(specimen.metaLine).toContain("Architecture digest");
    expect(specimen.sections).toEqual(DIGEST_PREVIEW_ARCHITECTURE_SECTIONS);
    expect(specimen.footnote.toLowerCase()).toContain("does not send immediately");
  });

  it("leaves To unset when destination is empty", () => {
    const specimen = buildDigestPreviewBeforeSubscribeSpecimen({
      variant: "architecture-subscription",
      channelType: "TeamsWebhook",
      digestTypeLabel: "Architecture digest",
    });

    expect(specimen.toLine).toBe(" — ");
    expect(specimen.metaLine).toContain("Teams webhook");
    expect(specimen.subjectLine).toBe("Architecture digest");
  });

  it("builds sponsor schedule specimen with recipients and cadence", () => {
    const specimen = buildDigestPreviewBeforeSubscribeSpecimen({
      variant: "sponsor-schedule",
      recipientEmails: ["sponsor@example.com", "ciso@example.com"],
      cadenceSummary: "Every Monday at 8:00 AM Eastern",
    });

    expect(specimen.subjectLine).toMatch(/Sponsor digest/i);
    expect(specimen.toLine).toBe("sponsor@example.com (+1 more)");
    expect(specimen.metaLine).toContain("Every Monday at 8:00 AM Eastern");
    expect(specimen.sections).toEqual([...DIGEST_PREVIEW_SPONSOR_SECTIONS]);
    expect(resolveDigestPreviewHelper("sponsor-schedule")).toMatch(/sponsor digest/i);
  });
});