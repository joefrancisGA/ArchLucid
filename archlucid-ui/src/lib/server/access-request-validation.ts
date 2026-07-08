import "server-only";

const MAX_NAME_CHARS = 120;
const MAX_EMAIL_CHARS = 320;
const MAX_COMPANY_CHARS = 200;
const MAX_ROLE_CHARS = 120;
const MAX_CLOUD_FOCUS_CHARS = 160;
const MAX_NOTE_CHARS = 2000;

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "msn.com",
  "me.com",
  "mail.com",
]);

export type AccessRequestPayload = {
  readonly name: string;
  readonly workEmail: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly cloudPlatformFocus: string | null;
  readonly note: string | null;
  readonly websiteUrl: string | null;
};

export type AccessRequestValidationResult =
  | { readonly ok: true; readonly value: AccessRequestPayload }
  | { readonly ok: false; readonly message: string };

function trimRequired(value: unknown, maxChars: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > maxChars) {
    return trimmed.slice(0, maxChars);
  }

  return trimmed;
}

function trimOptional(value: unknown, maxChars: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > maxChars) {
    return trimmed.slice(0, maxChars);
  }

  return trimmed;
}

function isWorkEmailAddress(email: string): boolean {
  const at = email.lastIndexOf("@");

  if (at <= 0 || at === email.length - 1) {
    return false;
  }

  const domain = email.slice(at + 1).toLowerCase();

  if (domain.length === 0 || domain.includes(" ") || !domain.includes(".")) {
    return false;
  }

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return false;
  }

  return true;
}

export function parseAccessRequestBody(body: unknown): AccessRequestValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body is required." };
  }

  const record = body as Record<string, unknown>;
  const name = trimRequired(record.name, MAX_NAME_CHARS);

  if (name === null) {
    return { ok: false, message: "Name is required." };
  }

  const workEmailRaw = trimRequired(record.workEmail, MAX_EMAIL_CHARS);

  if (workEmailRaw === null) {
    return { ok: false, message: "Work email is required." };
  }

  const workEmail = workEmailRaw.toLowerCase();

  if (!isWorkEmailAddress(workEmail)) {
    return { ok: false, message: "Enter a valid work email address." };
  }

  const company = trimRequired(record.company, MAX_COMPANY_CHARS);

  if (company === null) {
    return { ok: false, message: "Company is required." };
  }

  const roleTitle = trimRequired(record.roleTitle, MAX_ROLE_CHARS);

  if (roleTitle === null) {
    return { ok: false, message: "Role or title is required." };
  }

  const websiteUrl = trimOptional(record.websiteUrl, 500);

  if (websiteUrl !== null) {
    return {
      ok: true,
      value: {
        name,
        workEmail,
        company,
        roleTitle,
        cloudPlatformFocus: null,
        note: null,
        websiteUrl,
      },
    };
  }

  return {
    ok: true,
    value: {
      name,
      workEmail,
      company,
      roleTitle,
      cloudPlatformFocus: trimOptional(record.cloudPlatformFocus, MAX_CLOUD_FOCUS_CHARS),
      note: trimOptional(record.note, MAX_NOTE_CHARS),
      websiteUrl: null,
    },
  };
}
