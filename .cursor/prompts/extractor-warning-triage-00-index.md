<!-- SecureNow extractor warning triage. Origin: 2026-10-22 package
     C:\ArchLucid\securenow-azure-package.zip, warningCount=8, subscription
     0966098b-4d6c-4f09-af1b-965bc2a2ad1d. Do not implement from this index. -->

# Extractor warning triage — Composer prompt set (EXW-01–EXW-08)

Paste **one** numbered file per Composer 2.5 session.

Copy-paste docs index: [`docs/architecture/EXTRACTOR_WARNING_TRIAGE_PROMPTS.md`](../../docs/architecture/EXTRACTOR_WARNING_TRIAGE_PROMPTS.md).

These prompts classify the warnings from that package. They do not rebuild collectors.

| # | Prompt | What it does |
|---|--------|----------------|
| 1 | **EXW-01** | Probe AKS `runCommand` for `aks-maks-hi-nprd-weus-300` and classify `http-error` |
| 2 | **EXW-02** | Probe Fabric capacity workspace list for `hihapfabriccapcitynprd` |
| 3 | **EXW-03** | Probe Defender security contacts |
| 4 | **EXW-04** | Probe Defender governance assignments |
| 5 | **EXW-05** | Probe Defender attack paths and the CSPM pricing tier |
| 6 | **EXW-06** | Probe Defender vulnerability sub-assessments |
| 7 | **EXW-07** | Probe Policy Insights when `policy-compliance.json` has zero records |
| 8 | **EXW-08** | Stop governance warnings from claiming HTTP 404 unless that status was returned |
| 9 | **EXW-09** | Ship EXW-00–EXW-08 on `origin/master` (branch, tests, commit discipline) |

## Do not paste these

DFV-04, DFV-07, DFV-08, DFV-09, NR-36, and NR-40 already shipped. The 2026-10-22 run exercised them. Pasting them again re-implements finished collectors.

EXW-01 through EXW-07 do not edit the repo, assign RBAC, or re-run `Get-SecureNowAzurePackage.ps1`. EXW-08 is the only code change. It can run after EXW-04 or on its own.
