# SN-HAND-01 — Design note: engineer-to-analyst handoff

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-MENU-04 and SN-ED-03. **Design only. Do not write product code in this session.**

## Goal

A short design note that describes one shared workflow for cloud security engineers and GRC analysts, built from objects SecureNow already has, and lists the smallest gaps between today and that workflow. It becomes the source for a later prompt set.

## Why

The owner's rollout is security architect first, CISO staff second, then cloud security engineers and GRC analysts who share a workflow. Engineers own findings and remediation. Analysts own frameworks and audit evidence, ARC-AMPE in the UHG edition. The handoff between them is the point where a fixed finding becomes control evidence.

## Read first

- The SN-MENU-01 groups and SN-MENU-02 labels
- `docs/library/SECURENOW_ARCHITECT_PLANE.md`
- `docs/library/INFRA_EVIDENCE_PLANE.md` (control to evidence chain)
- `docs/library/POLICY_PACK_ARC_AMPE_DESIGN.md` (`frameworkMappings`)
- The pages behind My findings, All findings, Remediation tracker, Effective rules, and Audit evidence
- `docs/securenow/TECHNICAL_BACKLOG.md`

## What to write

`docs/securenow/ENGINEER_ANALYST_HANDOFF.md`:

1. **Personas and their questions.** Security architect, CISO staff, cloud security engineer, and GRC analyst: the three questions each asks most, and the page that answers each today.
2. **One workflow.** The path from a finding to a verified fix to a control marked as evidenced, naming the existing object and page at each step.
3. **Handoff points.** Where work passes from engineer to analyst and back, what each one needs to see at that moment, and whether it exists today.
4. **Gaps.** A numbered list of the smallest changes that would close each missing handoff, each one sized as UI only, API plus UI, or schema plus API plus UI. No implementation detail beyond that.
5. **Edition differences.** What changes when the analyst's main framework is ARC-AMPE (UHG) instead of NIST SP 800-53, OWASP ASVS, or the Microsoft cloud security benchmark (generic).
6. **What not to build.** Anything that would hide a review workspace tab, add a second findings list, or let AI mark a control as evidenced.

Keep it under about 150 lines. Use the sidebar labels from SN-MENU-02.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Docs only.
- Do not commit.

## Done when

The note shows one engineer-to-analyst workflow made of existing pages, marks where it breaks, and sizes each gap.
