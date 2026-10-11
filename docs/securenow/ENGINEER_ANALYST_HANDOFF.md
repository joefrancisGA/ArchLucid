# SecureNow engineer-to-analyst handoff

**Status:** Design note for the shared SecureNow workflow. It describes current
objects and pages first, then sizes the smallest gaps. It does not introduce a
second collector, a second findings list, or an automated compliance
attestation.

## 1. Personas and the questions they ask

| Persona | Three questions | Current answer |
|---|---|---|
| Security architect | What is dangerous? Why does it matter? What change reduces the most risk? | **My findings** (`/security/assigned-to-me`), **All findings** (`/compliance/findings`), and the evidence-path inspector behind a finding. |
| CISO staff | What is the material exposure? Is work progressing? What can I show leadership? | **All findings**, **Priorities & waves** (`/security/remediation-factory`), and **Remediation tracker** (`/security/remediation-instances`). |
| Cloud security engineer | What resource or identity is affected? What should I change? How do I know the change worked? | **All findings**, the finding's cited `SecurityEvidencePath`, **Fix playbooks** (`/security/remediation-patterns`), and the next inventory snapshot from **Data sources**. |
| GRC analyst | Which requirement is affected? What evidence supports it? Is the evidence current and reviewable? | **Frameworks** (`/compliance/policy-packs`), **Effective rules** (`/compliance/standards-and-rules`), and **Audit evidence** (`/compliance/audit-evidence`). |

The architect and engineer work from operational findings and cited paths.
The analyst works from framework requirements and evidence lineage. CISO staff
consume the same records through priority and progress views; they do not need
a parallel executive findings queue.

## 2. One shared workflow

1. **Observe:** the live collection agent or manual fallback produces an
   `AzureInventorySnapshot`. The snapshot is scoped to the tenant and is the
   shared observation for architecture, security, remediation, and audit.
2. **Diagnose:** a deterministic architect engine emits an
   `OperationalSecurityFinding` that cites a `SecurityEvidencePath`. The path
   records its ordered hops, evidence references, provenance, and weakest
   `PathConfidenceBand`. AI may explain the cited path; it is not evidence.
3. **Prioritize:** the engineer and architect review the finding in **My
   findings** or **All findings**, then use **Priorities & waves** to group
   work by exposure, privilege, blast radius, consequence, and confidence.
4. **Plan:** the engineer opens a **Fix playbook** and creates or reviews a
   remediation instance in **Remediation tracker**. Execute remains advisory:
   runbook, Terraform representation, or ITSM action; SecureNow does not apply
   customer Azure changes.
5. **Verify:** the customer makes the approved change. A later collection
   creates Snapshot B. The comparison with Snapshot A verifies the technical
   change and can invalidate evidence whose source rows changed.
6. **Map:** the analyst opens **Frameworks** and **Effective rules** to identify
   the requirement and selector. **Audit evidence** shows the chain from
   requirement to deterministic evaluation, normalized evidence, resource ID,
   raw source pointer, timestamp, and collector/selector version.
7. **Disposition:** a human analyst records the evidence disposition or review
   decision. Automated evaluation is not an auditor conclusion, and AI cannot
   mark a control as evidenced.

## 3. Handoff points

| Handoff | Engineer needs | Analyst needs | Today |
|---|---|---|---|
| Finding → requirement | Finding ID, affected resources, cited path, confidence, proposed cut | Framework, control/theme, scope, and why the path is relevant | Partly exists: finding paths and policy mappings are separate surfaces. |
| Approved change → verification | Pattern, instance, preconditions, rollout warning, and target resource IDs | Expected evidence rows and the snapshot that will re-evaluate them | Exists in pieces: remediation and collection are separate; the expected-evidence handoff is implicit. |
| Snapshot change → evidence | Before/after diff and whether the finding closed | Freshness, invalidated hashes, deterministic evaluation, and human disposition | Evidence lineage and snapshot comparison exist, but the cross-role queue is missing. |
| Evidence → leadership | Risk reduced, residual confidence, and unresolved gaps | Requirement coverage, citations, and limitations | Metrics and audit evidence exist; a shared handoff summary does not. |

The handoff must be bidirectional. An analyst may reject stale or insufficient
evidence and send the engineer back to the cited finding. An engineer may
identify that a requirement's selector lacks a required snapshot property; that
is an evidence-plane gap, not permission to invent a control result.

## 4. Smallest gaps

1. **Finding-to-requirement context — UI only.** Add a compact “Related
   requirements” panel on the finding/path inspector that links to the
   existing Effective rules and Audit evidence pages without duplicating
   findings.
2. **Engineer handoff bundle — UI only.** Add a shared handoff view that
   displays finding, path, remediation instance, target resources, proposed
   verification query, and current confidence in one read-only composition.
3. **Explicit handoff state — API plus UI.** Persist who sent an item, who
   received it, the linked finding/remediation/evidence IDs, and a small state
   set such as `NeedsEngineer`, `NeedsAnalyst`, `NeedsEvidence`, and `Resolved`.
4. **Evidence invalidation handoff — schema plus API plus UI.** Persist the
   source snapshot fingerprint and affected requirement IDs so Snapshot B can
   visibly mark evidence stale and route it back to the right engineer or
   analyst.
5. **Requirement-aware verification preview — API plus UI.** Given an existing
   selector, show the evidence rows expected after a proposed change without
   claiming that the change has happened.
6. **Shared outcome summary — UI only.** Add a CISO-safe summary derived from
   existing findings, remediation, snapshot, and evidence records. It must show
   unresolved gaps and confidence limitations rather than a single compliance
   score.

## 5. Edition differences

The workflow and evidence chain stay the same. The analyst's catalog changes:

- **Generic SecureNow:** start with NIST SP 800-53, OWASP ASVS, and the
  Microsoft cloud security benchmark. Framework mappings and selectors remain
  catalog-driven, so adding AWS or GCP later does not require a new handoff
  model.
- **UHG SecureNow:** make ARC-AMPE the primary analyst view, with its thematic
  mappings to NIST and its Volume II/SSPP pointers. ARC-AMPE status remains
  architecture evidence and automated evaluation, not CMS conformity, SSPP
  authoring, legal classification, or third-party attestation.

## 6. What not to build

- Do not hide desktop review workspace tabs behind a **More** menu.
- Do not add a second findings list for GRC analysts.
- Do not create a second Azure collector or an ARC-AMPE-specific ARM harvest.
- Do not let AI mint evidence, authoritative mappings, auditor conclusions, or
  a control-as-evidenced decision.
- Do not turn technical readiness into a compliance or attestation score.
- Do not add customer Azure write roles or an automatic `terraform apply`.
