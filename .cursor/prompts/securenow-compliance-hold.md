# SN-COMP-HOLD — SecureNow compliance readiness stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-COMP prompts:

- A CPA SOC 2 program, a Type II report, or any edit whose purpose is **G-REAL-05**. Tech tracking **TB-135** stays closed.
- A third-party penetration-test statement or **G-ASSURANCE-02** execution. Tech tracking **TB-136** stays closed.
- Editing `docs/security/SOC2_SELF_ASSESSMENT_2026.md` or `docs/security/COMPLIANCE_MATRIX.md` to make them SecureNow certifications.
- Filling `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` with control outcomes.
- A numeric compliance score, a percent, or a model-written disposition.
- A new audit-evidence API, SQL table, or second evidence store for the markdown download.
- An Azure write, an ARM change, or `terraform apply`.
- A new policy-pack JSON file, or a pasted catalog of control identifiers.
- The phrases `SOC 2 certified`, `ISO 27001 certified`, `audit passed`, or `CMS attestation` as product claims.
- A product marketing route for the responsibility note.
- Hiding a desktop review workspace tab behind a More menu.
- More than one SN-COMP prompt in the same session.
- Setting `continue-on-error` to false on the compliance checker.
- Adding the new docs to `claims()` in `build_two_product_commercial_workpack.py`.

If the session is about to do one of these, stop and report which line it hit.
