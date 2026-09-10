> **Scope:** Copy-paste Composer/Cloud Agent prompts to make SecureNow Category-1 help drawers and `/help/{slug}` articles **job-match** the Security-shell pages they sit on. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/securenow-help-00-index.md`](../../.cursor/prompts/securenow-help-00-index.md) (**SH-01–SH-26**)
> **Depends on:** display-name helper from [SN-01](../../.cursor/prompts/securenow-brand-01-display-name-chrome.md). **SN-04** is brand rewrite only — it does not fix job match.
> **Do not fork:** Architecture help bodies; second API/UI host; company legal entity; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse

# SecureNow help job-match — Composer prompts (SH-01–SH-26)

**Created:** 2026-09-10 · **Status:** ready to run · **Audience:** Cursor Composer correcting Security-shell help that still describes Architecture review / Approval pages.

Paste **one** `.cursor/prompts/securenow-help-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

## Why this set exists

SN-04 made Security help *say* SecureNow. Help on Home, findings, policy packs, remediation factory, audit lineage, and infrastructure workbenches still *teaches* architecture reviews, approval queues, AWS/GCP, Slack, and billing settings the Security shell does not show.

Shared mechanics:

- Prefix `/governance` in `governance-approval-rows.ts` steals Category-1 copy for every unlisted `/governance/*` child.
- `pageHelpTopicForPathname` has no product-line switch, so Learn more can open `first-architecture-review`, `governance-approval`, `cloud-connections`, or `evidence-intake` from the wrong page.
- Help search “Start here” still lists first architecture review.

## Diagnosis → prompt

See [`.cursor/prompts/securenow-help-00-index.md`](../../.cursor/prompts/securenow-help-00-index.md) for the full table, run order, pages that already match, and global constraints.

## Sequencing

**SH-01** first (product-line resolver pattern). **SH-07–SH-17** and **SH-26** after the `/governance` steal can be overridden. Article rewrites **SH-02–SH-06** and **SH-18–SH-25** can parallel after 01.

## Product vs company

Unchanged from SN-00: SecureNow is the Security product display name; ArchLucid stays the Architecture product and legal company.
