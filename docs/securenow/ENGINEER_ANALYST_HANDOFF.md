> **Scope:** SecureNow engineer-to-analyst handoff design note for architects and GRC; workflow boundaries only, not implementation prompts or audit conclusions.

# Engineer-to-analyst handoff

**Status:** Design note only (SN-HAND-01). Not an implementation prompt.
**Sidebar names:** SN-MENU-02 (`SECURENOW_NAV_LABELS`).
**Readers:** security architect, CISO staff, cloud security engineer, GRC analyst.

One workflow. Engineers own findings and fixes. Analysts own frameworks and audit evidence. The handoff is the moment a verified fix becomes evidence for a control.

## Personas and their questions

| Persona | Question | Page that answers it today |
|---|---|---|
| Security architect | What should we fix first? | Priorities & waves |
| Security architect | Does the collected environment match the diagram we uploaded? | Diagram reconciliation |
| Security architect | Which organization rules are we measuring against? | Frameworks, then Effective rules |
| CISO staff | What is open, and who owns it? | All findings |
| CISO staff | How fresh is the collection, and did it fail? | Home (workspace, subscription, latest collection, capture gap) |
| CISO staff | What changed since the last collection? | Changes & drift |
| Cloud security engineer | Which findings are mine? | My findings |
| Cloud security engineer | What is the reusable fix, and where is this instance? | Fix playbooks, then Remediation tracker |
| Cloud security engineer | Did the later collection confirm the fix? | Remediation tracker (awaiting verification is `ChangeImplemented` only) |
| GRC analyst | Which framework is in force here? | Frameworks |
| GRC analyst | Which rules apply, and which conflict? | Effective rules |
| GRC analyst | What evidence supports this control? | Audit evidence |

Ask about your environment answers a cited question. It does not assign a finding or mark a control evidenced.

## One workflow

Objects already on the infra-evidence and policy-pack planes. SecureNow does not change Azure.

1. **Collection.** Azure connections (or Manual upload) produce an inventory snapshot. Home states the workspace, the subscription scope, and whether that capture is ready or has a gap.
2. **Finding.** The architect engines write an operational finding that cites a path. All findings lists it. My findings lists it when it is assigned.
3. **Priority.** Priorities & waves reads `criticalExposureCount` and groups fixes. It does not open a second findings list.
4. **Playbook.** Fix playbooks holds the reusable fix for similar findings.
5. **Instance.** Remediation tracker holds one instance from planned through verified. `Executed` is still waiting for an attestation. `ChangeImplemented` is waiting for a check against a later snapshot. `VerificationFailed` is a failed check, not a new finding.
6. **Control.** Effective rules shows the pack rule, including `frameworkMappings`. Audit evidence traces that control to snapshot rows, the raw evidence pointer, and the collection time. A human disposition is the analyst's conclusion. The product does not write that conclusion.

## Handoff points

| Moment | Engineer needs | Analyst needs | Today |
|---|---|---|---|
| Finding opened | Severity, resource, owner | The control the rule maps to | Finding and rule exist. The assigned queue does not show the control beside the owner. |
| Fix planned | Playbook and instance | Which framework rule the instance serves | Tracker and Effective rules are separate pages. No shared row. |
| Check passed (`Verified`) | The verifying snapshot | The same snapshot cited on the control | Both can be opened. Nothing records that this instance evidenced this control. |
| Check failed | The failed count and the instance | That the control is still unevidenced | Home counts `VerificationFailed` and links to Remediation tracker (gap 3). Audit evidence lineage shows **Latest remediation attempt** when `latestRemediationAttempt` is returned (gap 4, SN-HAND-09–10). The positive checkbox is unchanged. |

Work passes back when verification fails: the analyst still has an open control, and the engineer still has the instance.

## Gaps

1. **UI only.** On My findings, show the framework control already stored on the finding or its rule. Do not add a field.
2. **UI only.** From a Remediation tracker instance, link to Audit evidence for that control when the rule mapping already names one.
3. **UI only.** From the Home "checks failed" count, open Remediation tracker filtered to `VerificationFailed`.
4. **API plus UI.** Audit evidence lists the remediation instance that last tried to satisfy the control when no verified association row covers that instance on the lineage response. Return the existing instance id and status on the evidence read model when a mapping already exists. Do not invent a score. **Shipped on trunk:** **SN-HAND-09** (`latestRemediationAttempt` on lineage), **SN-HAND-10** (spine row on Audit evidence). Prompt archive: [`../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md).
5. **Schema plus API plus UI.** There is no row that says "verified instance X, snapshot Y, evidenced control Z." Add that association only. Do not copy snapshot bytes into a second evidence store. Implementation prompts for this gap only: [`../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md) (**SN-HAND-05–SN-HAND-08**). Gaps 1–4 are not in that set.

## Implementation status (trunk)

| Gap | Status | Where it lives |
|-----|--------|----------------|
| **1** | **Shipped (UI)** | **My findings** queue shows `Framework control` from `policyRuleId` on each row (`GovernanceFindingsQueueAssignedToMeRowCells.tsx`). |
| **2** | **Shipped (UI)** | **Remediation tracker** links to Audit evidence lookup with `?controlId=` when the instance finding stores `controlId` (`RemediationWorkbenchClient.tsx`, `infra-remediation-open-audit-evidence`). Verified-association rows use the same lookup pattern when `assessmentId` is present (SN-HAND-08). |
| **3** | **Shipped (UI)** | **Home** work summary appends “checks failed” and links to Remediation tracker with `status=VerificationFailed` (`SecureNowHomeWorkSummary.tsx`). |
| **4** | **Shipped** | **SN-HAND-09** lineage field `latestRemediationAttempt`; **SN-HAND-10** **Latest remediation attempt** row on Audit evidence (`AuditEvidenceLineageSpine.tsx`). Do not conflate with gap 5 `verifiedRemediationAssociations` (verified pass only). |
| **5** | **Shipped** | **SN-HAND-05–08** on trunk: association table, verify write, lineage read, Audit evidence + Remediation tracker UI. |

## Edition differences

The pages stay the same. The featured pack changes.

- **Generic.** Frameworks leads with NIST SP 800-53, OWASP ASVS, and the Microsoft cloud security benchmark. Organization packs follow, tagged Organization.
- **UHG.** Frameworks leads with ARC-AMPE, then the generic list. The analyst's evidence chain cites ARC-AMPE themes. It is still not a CMS attestation.
- **Organization starter.** A custom pack created from `organization-security-architecture-starter` is an organization pack beside those frameworks. Placeholders are the architect's text. They are not a certification.

## What not to build

- A second findings list for analysts. All findings and My findings stay the two lists.
- A control marked evidenced by a model. AI may explain the chain. A person records the disposition.
- Hiding a review workspace tab behind a More menu.
- An Azure write, an ARM change, or `terraform apply` from this workflow.
- A tenant-wide sealed decision list, or a diagram-document table, on this handoff.
