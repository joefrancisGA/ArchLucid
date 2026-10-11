# SN-MENU-HOLD — SecureNow menu and editions stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-MENU, SN-ED, SN-PACK, SN-COL, SN-DEP, or SN-HAND prompts:

- A rename of SecureNow, or copy that compares SecureNow with ServiceNow.
- A moved or renamed route. Labels change; hrefs do not.
- A change to Architecture shell labels, tooltips, groups, or Home.
- Title Case in the SecureNow sidebar, or casing applied through CSS or string transforms.
- A review workspace tab hidden behind More.
- An edition or hosting mode that a cookie, header, query string, or user setting can change.
- `ArchLucid` rendered anywhere in the UHG edition, or an allowlist entry that permits it outside `src/lib/editions/generic/`.
- UHG-specific code outside `src/lib/editions/uhg/` (UI) or an equivalent clearly named UHG location (API).
- Kubernetes, Snowflake, BI, ADF, or identity pages for the UHG edition, or placeholder "coming soon" links.
- AWS or GCP collection.
- A second collector. The agent reuses the existing extractor package.
- Any write to customer Azure resources, other than the single on-demand trigger permission an accepted ADR names.
- Storage account shared keys, SAS tokens in configuration, or public network access on SecureNow data services in the in-tenant root.
- `terraform apply`, or creating Azure resources from a session.
- Product code in an ADR or design-note session (SN-COL-01, SN-DEP-01, SN-HAND-01).
- Starting SN-COL-02 or later before SN-COL-01 is Accepted, or SN-DEP-02 or SN-DEP-03 before SN-DEP-01 is Accepted.
- Copied framework text from NIST, OWASP, or Microsoft. Cite identifiers and paraphrase.
- A pack rule at `Critical` severity.
- An AI that drafts pack rules in the product, marks a control evidenced, or answers for a person.
- SQL row-level security, or removing tenant, workspace, or project scoping because an install has one tenant.
- Legal statements about intellectual property in code, comments, or docs.

If the session is about to do one of these, stop and report which line it hit.
