# Healthcare data workflow (starter)

## When to use

- Prospect runs a **clinical or operational data workflow** on Azure (HL7/FHIR-oriented language, PHI boundaries) and wants a **second** review focused on segmentation, audit, and residency wording — **without** real PHI.

## What is in this pack

| File | Purpose |
|------|---------|
| `second-run.json` | SECOND_RUN for CLI or wizard paste |
| `architecture-request.json` | Full POST body with topology and security hints |
| `policy-context.json` | Points at `templates/policy-packs/healthcare` |
| `proof-package-checklist.md` | Checklist for the committed review package |

## What not to claim

- Do **not** claim **HIPAA compliance**, **BAAs**, or **HIPAA attestation** from ArchLucid outputs.
- Do **not** paste real **PHI**, **MRNs**, or production interfaces.
- Do **not** present findings as **legal or regulatory sign-off**.

## Sample disclaimer

Narrative uses **Contoso Clinical (fictional)** only. Replace every name, endpoint, and data class with your own before sharing outside a sandbox.
