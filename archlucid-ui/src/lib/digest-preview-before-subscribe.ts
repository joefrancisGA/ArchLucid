/**
 * Source of truth for digest preview-before-subscribe copy and specimen builders (TB-2211).
 * In-app specimen only — no compose-preview or send-to-me API exists today.
 */

import { DIGESTS_BROWSE_INCLUDES_ITEMS } from "@/lib/digests-browse-copy";
import { channelDisplayLabel } from "@/lib/digest-subscription-form";

export type DigestPreviewBeforeSubscribeVariant = "architecture-subscription" | "sponsor-schedule";

export type DigestPreviewBeforeSubscribeInput = {
  readonly variant: DigestPreviewBeforeSubscribeVariant;
  /** Subscription display name from the create form. */
  readonly subscriptionName?: string;
  readonly channelType?: string;
  readonly destination?: string;
  /** Human label for digest type (e.g. Architecture digest). */
  readonly digestTypeLabel?: string;
  /** Direct recipients on the sponsor schedule form. */
  readonly recipientEmails?: readonly string[];
  /** Live cadence summary (e.g. Every Monday at 8:00 AM Eastern). */
  readonly cadenceSummary?: string;
};

export type DigestPreviewBeforeSubscribeSpecimen = {
  readonly subjectLine: string;
  readonly toLine: string;
  readonly metaLine: string;
  readonly sectionsHeading: string;
  readonly sections: readonly string[];
  readonly bodyLead: string;
  readonly footnote: string;
};

export const DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE = "Preview before you subscribe" as const;

export const DIGEST_PREVIEW_BEFORE_SUBSCRIBE_HELPER =
  "Review a faithful specimen of digest content for the destination and cadence you configured. This is not a live compose from your workspace data." as const;

export const DIGEST_PREVIEW_BEFORE_SUBSCRIBE_SCHEDULE_HELPER =
  "Review a specimen of the sponsor digest email for the recipients and schedule below. This is not a live compose from your workspace data." as const;

export const DIGEST_PREVIEW_SECTIONS_HEADING = "Sections included" as const;

/** Architecture-digest body sections — aligned with Browse includes list. */
export const DIGEST_PREVIEW_ARCHITECTURE_SECTIONS: readonly string[] = [
  ...DIGESTS_BROWSE_INCLUDES_ITEMS,
];

/** Sponsor weekly rollup sections (deterministic sponsor email). */
export const DIGEST_PREVIEW_SPONSOR_SECTIONS = [
  "Architecture and review activity summary",
  "Governance and finding highlights",
  "Open decisions needing sponsor attention",
  "Links into Browse and the Decision register",
] as const;

export const DIGEST_PREVIEW_SEND_TO_ME_LABEL = "Send preview to me" as const;

export const DIGEST_PREVIEW_SEND_TO_ME_UNAVAILABLE_REASON =
  "Send preview to me is unavailable — ArchLucid does not expose a digest compose-preview or send-to-me API yet. Use the in-app specimen above." as const;

export const DIGEST_PREVIEW_SPECIMEN_BADGE = "Specimen" as const;

const PLACEHOLDER_DESTINATION = " — ";

function resolveArchitectureSubject(input: DigestPreviewBeforeSubscribeInput): string {
  const typeLabel = input.digestTypeLabel?.trim();

  if (typeLabel !== undefined && typeLabel.length > 0) {
    return typeLabel;
  }

  return "Architecture digest";
}

function resolveToLine(input: DigestPreviewBeforeSubscribeInput): string {
  if (input.variant === "sponsor-schedule") {
    const emails = (input.recipientEmails ?? [])
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      return PLACEHOLDER_DESTINATION;
    }

    if (emails.length === 1) {
      return emails[0]!;
    }

    return `${emails[0]} (+${emails.length - 1} more)`;
  }

  const destination = input.destination?.trim();

  if (destination !== undefined && destination.length > 0) {
    return destination;
  }

  return PLACEHOLDER_DESTINATION;
}

function resolveMetaLine(input: DigestPreviewBeforeSubscribeInput): string {
  if (input.variant === "sponsor-schedule") {
    const cadence = input.cadenceSummary?.trim();

    if (cadence !== undefined && cadence.length > 0) {
      return `Channel: Email · Cadence: ${cadence}`;
    }

    return "Channel: Email · Cadence: Weekly (configure day and time above)";
  }

  const channel = channelDisplayLabel(input.channelType?.trim() || "Email");
  const typeLabel = input.digestTypeLabel?.trim() || "Architecture digest";

  return `Channel: ${channel} · Type: ${typeLabel}`;
}

export function resolveDigestPreviewHelper(variant: DigestPreviewBeforeSubscribeVariant): string {
  switch (variant) {
    case "architecture-subscription":
      return DIGEST_PREVIEW_BEFORE_SUBSCRIBE_HELPER;
    case "sponsor-schedule":
      return DIGEST_PREVIEW_BEFORE_SUBSCRIBE_SCHEDULE_HELPER;
    default: {
      const _exhaustive: never = variant;

      return _exhaustive;
    }
  }
}

export function buildDigestPreviewBeforeSubscribeSpecimen(
  input: DigestPreviewBeforeSubscribeInput,
): DigestPreviewBeforeSubscribeSpecimen {
  if (input.variant === "sponsor-schedule") {
    return {
      subjectLine: "Sponsor digest — weekly architecture rollup",
      toLine: resolveToLine(input),
      metaLine: resolveMetaLine(input),
      sectionsHeading: DIGEST_PREVIEW_SECTIONS_HEADING,
      sections: DIGEST_PREVIEW_SPONSOR_SECTIONS,
      bodyLead:
        "This specimen shows the sponsor email shape for the cadence and direct recipients configured on this schedule.",
      footnote:
        "Enabling or saving the sponsor schedule does not consume AI budget. Delivery starts on the next scheduled send after outbound email is ready.",
    };
  }

  return {
    subjectLine: resolveArchitectureSubject(input),
    toLine: resolveToLine(input),
    metaLine: resolveMetaLine(input),
    sectionsHeading: DIGEST_PREVIEW_SECTIONS_HEADING,
    sections: DIGEST_PREVIEW_ARCHITECTURE_SECTIONS,
    bodyLead:
      "Architecture digests summarize advisory scan results and related review signals for the destination you configure.",
    footnote:
      "Saving a subscription does not send immediately. Enabled destinations receive the next generated architecture digest after advisory generation runs.",
  };
}

export function isDigestPreviewSendToMeAvailable(): boolean {
  return false;
}