> **Scope:** SecureNow control-evidence responsibility for a customer framework. Not an ATO. Not a CPA SOC 2 report. Not a CMS attestation. Not an approved customer offer. Beta remains NO_GO.

# SecureNow control-evidence responsibility

A person records control disposition; SecureNow cites the evidence chain.

| Duty | Customer control owner | SecureNow | Out of scope |
| --- | --- | --- | --- |
| Collection scope and freshness | Authorizes the Azure scope and reviews whether the capture is current. | Shows the environment line, collection time, and any collection gap. | Treating a gap as a clean bill of health. |
| Path or finding citation | Names the security concern and reviews the cited resource. | Shows cited hops, provenance, and the finding or rule context. | Claiming an observed exploit or observed traffic from a possible path. |
| Advisory cut | Decides whether and how a change enters change control. | Shows an advisory cut point and any linked playbook. | Azure writes, ARM changes, or `terraform apply` from SecureNow. |
| Later verification | Supplies an authorized later capture and external change attestation. | Shows **NOT VERIFIED** when capture, analysis, attestation, or postcondition is missing. | A silent pass or a verified claim from fixture data alone. |
| Control disposition | A GRC analyst records the human disposition against authorized evidence. | Links the control to snapshot evidence and any verified remediation association. | A model-marked “control evidenced” decision. |
| Assurance opinion | The customer’s auditor or assessor issues any assurance opinion. | Describes evidence lineage and its limitations. | CPA SOC 2, ISO 27001 certification, or a CMS ATO. |

## What this note does not include

This note does not fill [`EXECUTIVE_PROOF_PACKET_TEMPLATE.md`](EXECUTIVE_PROOF_PACKET_TEMPLATE.md), start **G-REAL-05** or **G-ASSURANCE-02**, or turn a fixture walkthrough into customer evidence. It is a duty split, not an attestation.
