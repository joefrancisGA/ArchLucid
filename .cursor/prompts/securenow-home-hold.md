# SN-HOME-HOLD — SecureNow Home stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-HOME prompts:

- A row of three extra actions ("Review my findings", "Explore resources", "Track remediation") above the directory. The work summary in SN-HOME-03 is those actions.
- The SN-MENU-04 posture tiles (Last collection, Open findings, Frameworks) in addition to SN-HOME-02 and SN-HOME-03.
- A change to `OPERATOR_TYPE_SCALE`, or a SecureNow Home override to 14px, 15px, or 16px body text.
- A new API, SQL table, or collector to feed Home counts.
- A counted sentence such as "17 destinations".
- Deleting the honesty sentence that this page is not an official compliance report.
- Renaming "Ask about your environment" back to "Ask".
- A change to Architecture shell labels, the Architecture home, or `INFRASTRUCTURE_WORKBENCH_ROWS`.
- A moved or renamed route.
- A review workspace tab hidden behind More.
- Pastel or decorative cards on Home.
- Any write to customer Azure, `terraform apply`, or remediation that changes Azure.
- ARC-AMPE named on generic SecureNow Home when the edition is not `uhg`.

If the session is about to do one of these, stop and report which line it hit.
