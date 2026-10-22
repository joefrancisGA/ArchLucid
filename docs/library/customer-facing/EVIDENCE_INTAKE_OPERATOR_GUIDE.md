> **Scope:** Customer-facing — starting a review and uploading architecture evidence (in-app help). API and integration recipes live in engineering documentation, not on this page.

# Start a review

## What counts as evidence {#what-counts-as-evidence}

ArchLucid accepts architecture evidence that helps reviewers understand your design:

- **Written briefs** — goals, constraints, risks, and integration notes you type directly in the wizard.
- **Diagrams and documents** — PDF, Word, Markdown, plain text, JSON, or YAML exports from your architecture tools. Export Visio diagrams to PDF or PNG — native `.vsdx` is not supported.
- **Images** — PNG or JPEG snapshots of diagrams when a native export is not available.
- **Infrastructure as code** — Terraform (`.tf`), Bicep (`.bicep`), and YAML/JSON declarations.
- **Cloud inventory archives** — ZIP bundles from supported Azure, AWS, or GCP extractors when you connect a cloud account or upload an inventory package.

You can attach multiple files. At least one piece of evidence is required before you start analysis in most paths.

## Choose a starting path {#choose-a-starting-path}

On [**New architecture review**](/architecture/reviews/new), pick the path that matches how much structure you already have:

| Path | Best when |
| --- | --- |
| [**Quick start**](/architecture/reviews/new?path=quick-review) | You want the fastest first review: title, optional attachments, required baseline clarifications, then start analysis on one screen. |
| [**Guided questions**](/architecture/reviews/new?path=guided-intake) | You want clarifying questions and admission gates before analysis begins. |
| [**Templates and imports**](/architecture/reviews/new?path=detailed) | You need templates, imports, or fuller configuration for an export-ready architecture package. |

You can switch paths before you start the review. Each path uses the same evidence rules once you upload files.

## Upload mechanics and validation {#upload-mechanics-and-validation}

- **Drag files or browse** — use Browse files, Browse folder, or drag into the drop zone.
- **Validation is immediate** — unsupported types and malformed cloud inventory ZIPs show a specific message before analysis starts; fix the file and upload again.
- **Cloud evidence** — connect the account from **Cloud connections**, then follow the extractor guidance for that provider.

## Verify intake before finalize {#verify-intake-before-finalize}

**Verifying intake** means confirming that ArchLucid received the evidence you intended before you finalize the architecture package:

1. **Attachments listed** — every file you selected appears in the upload list with the correct names.
2. **Analysis started** — after **Start architecture review**, open the architecture package and confirm findings reference your uploads.
3. **No blocking validation errors** — resolve upload or ZIP validation messages before you commit or finalize.

If something is missing, add evidence from the architecture package **Evidence** tab before you finalize.

## Related guides {#related-guides}

- [Review guide](/help/review-guide) — step-by-step wizard field reference.
- [Cloud connections](/help/cloud-connections) — connect Azure, AWS, or GCP for inventory evidence.
- [Architecture packages](/help/review-packages) — browse, inspect, and export completed packages.
- [Your first architecture review](/help/first-architecture-review) — onboarding narrative for first-time architects.
