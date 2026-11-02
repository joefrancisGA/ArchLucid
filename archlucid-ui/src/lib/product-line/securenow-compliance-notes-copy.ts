export const SECURENOW_COMPLIANCE_NOTES_HEADING = "Compliance notes" as const;

export const SECURENOW_COMPLIANCE_NOTES_LEAD =
  "Duty split and framework coverage for a loaded lineage. Not a certification. SecureNow beta remains NO_GO." as const;

export const SECURENOW_COMPLIANCE_NOTES_GUARDRAIL =
  "This page does not start a CPA SOC 2 program or a third-party pen test." as const;

export const SECURENOW_COMPLIANCE_NOTES_DUTIES = [
  ["Collection scope and freshness", "The customer authorizes Azure scope; SecureNow shows collection status and gaps."],
  ["Path or finding citation", "The customer names the concern; SecureNow shows cited hops and provenance."],
  ["Advisory cut", "The customer decides the change; SecureNow shows an advisory cut point."],
  ["Later verification", "The customer supplies a later capture and attestation; missing elements remain NOT VERIFIED."],
  ["Control disposition", "A GRC analyst records disposition; SecureNow links control evidence and verified associations."],
  ["Assurance opinion", "The customer’s auditor or assessor issues an opinion; SecureNow does not certify the environment."],
] as const;

export const SECURENOW_COMPLIANCE_NOTES_PACKS = [
  "Microsoft cloud security benchmark",
  "NIST SP 800-53",
  "OWASP API Security Top 10",
  "arc-ampe-architecture-themes",
  "organization-security-architecture-starter",
] as const;

export const SECURENOW_COMPLIANCE_NOTES_LINKS = [
  {
    label: "Control-evidence responsibility",
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md",
  },
  {
    label: "Framework coverage",
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/FRAMEWORK_COVERAGE.md",
  },
] as const;
