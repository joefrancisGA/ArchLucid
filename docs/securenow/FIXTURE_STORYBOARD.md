> **Scope:** Facilitator storyboard for a SecureNow fixture demo. Not customer evidence, not a production validation, and not approved buyer communication.

# SecureNow fixture storyboard

Every beat below is a fixture. Substitute a real capture before any sponsor claim.

Use this with the internal [buyer proof demo script](BUYER_PROOF_DEMO.md). Do not present fixture output as a customer outcome.

## Beat 1 — Scope and freshness

**Screen:** SecureNow Home

**Point at:** The environment line (tenant, workspace, subscription scope), the latest collection time, and any collection gap called out on Home.

**Say:** "This walkthrough uses fixture data. Before we trust a path ranking, we confirm which Azure scope this capture covers and whether anything is missing or stale. A gap is a coverage limitation, not a clean bill of health."

**Do not say:** "Your environment is fully covered," "we scanned everything," or "this proves you are secure."

## Beat 2 — Find and inspect

**Screen:** Priorities & waves, then Path inspect

**Point at:** One ranked path ID, ordered cited hops, provenance labels, the weakest confidence band, and the dimensions that contributed to the rank.

**Say:** "SecureNow is showing a possible access path backed by cited inventory hops. We can explain why this path outranks alternatives. We are not claiming a numeric probability or that an attacker used this path."

**Do not say:** "This path was exploited," "likelihood is X percent," or "Defender missed this."

## Beat 3 — Advisory cut point

**Screen:** Path inspect

**Point at:** The advisory cut point on the selected path and the linked fix playbook when one exists.

**Say:** "This cut point is an analysis recommendation about where an engineer could intervene. It is not proof that the change is safe to implement without your change control."

**Do not say:** "SecureNow fixed it," "apply this Terraform now," or "this change is approved."

## Beat 4 — Engineer action

**Screen:** Remediation tracker

**Point at:** A remediation instance with runbook or Terraform representation shown as advisory only.

**Say:** "Your engineer decides and implements any Azure change outside SecureNow under your organization's approvals. SecureNow records the plan and the later collection. It does not change Azure."

**Do not say:** "SecureNow applied the change," "autonomous remediation," or "one-click fix."

## Beat 5 — Verify or fail honestly

**Screen:** Remediation tracker, later capture

**Point at:** A later successful Azure capture when you have one, the human change attestation, completed path analysis, and the substantive postcondition. When any element is missing, show the explicit **not verified** outcome.

**Say:** "Verification requires a later capture, your attestation, completed analysis, and a substantive postcondition. If any piece is missing, the honest result is not verified, not a silent pass."

**Do not say:** "Verified" when the later capture failed, "closed" without analysis completion, or "problem solved" from fixture data alone.

## Beat 6 — Audit trail

**Screen:** Audit evidence

**Point at:** The evidence association to the relevant control and where a person records disposition.

**Say:** "A GRC analyst, not the model, records control disposition against authorized evidence. The audit link shows traceability; it is not compliance certification."

**Do not say:** "SOC 2 certified," "audit passed," or "the AI signed off on the control."

## Invented fixture

The buyer demo uses an invented Azure storage account with an undesirable public-network-access property and a possible access path. The proposed control is to restrict that exposure.

No live system is changed during this demo. A passing later-capture example in the fixture is only a deterministic test case. A deliberately incomplete capture must not be accepted as evidence of closure.

## Claims we must not make from this fixture

Do not say SecureNow prevented a breach, observed exfiltration, or compliance-certified the environment. Do not say SecureNow autonomously repaired Azure, guaranteed cost savings, or that this synthetic case proves production detection accuracy.
