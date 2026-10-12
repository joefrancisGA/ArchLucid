> **Scope:** Author working space for the book draft *Managing Azure Security with AI* — outline, chapter drafts, and writing rules. Not product documentation, not buyer-facing copy, and not a description of SecureNow internals.
> **Status:** draft

# Managing Azure Security with AI — book draft

**Working title:** *Managing Azure Security with AI*
**Working subtitle:** *Evidence-Backed Attack-Path Analysis Without Trusting the Model Blindly*
**Outline:** [`OUTLINE.md`](OUTLINE.md) · **Chapters:** [`chapters/`](chapters/)

## Thesis

AI is useful in Azure security when it **explains evidence**, and dangerous when it **replaces evidence**. Readers learn to:

1. Collect Azure and Entra evidence with read-only access.
2. Reason about **paths** (who can reach what, with what privilege) instead of checklist items.
3. Keep every claim labeled by how it is known: observed, derived, inferred, AI-inferred, or human-asserted.
4. Use LLMs for explanation, triage, and drafting, while keeping decisions and changes with humans.
5. Verify remediation against the next snapshot instead of trusting "fixed".

## Audience

- Primary: Azure security architects and cloud platform engineers (2+ years of Azure).
- Secondary: security leaders who need to evaluate AI security tooling claims.

## IP boundary (read before writing)

This book teaches **principles and reproducible techniques** on public Azure APIs. It must not publish SecureNow / ArchLucid proprietary material.

| Allowed | Not allowed |
|---------|-------------|
| General concepts (attack paths, evidence categories, advisory remediation) | SecureNow ranking rules, weights, rule version strings |
| Public Azure tooling: Resource Graph, Microsoft Graph, Azure RBAC, Defender for Cloud, Sentinel, Copilot for Security | Internal engine designs, schemas, code, backlog IDs (SN-*, TB-*, FR-*) |
| Original sample tenant, sample queries, sample Terraform | Customer or pilot data, screenshots of non-public UI |
| One clearly marked case-study appendix (optional, owner-approved) | Product pitch inside teaching chapters |

Before any chapter leaves this repo (publisher, blog, reviewer), re-read it against this table.

## Writing rules

- Plain, direct sentences. Define every acronym on first use per chapter.
- Every technique ships with a runnable example in the companion lab (Terraform and queries in [`lab/`](lab/); planned to move to a separate public repo).
- Version-specific Azure features go in dated sidebars: `> **As of 2026-10:** ...`.
- No invented statistics. Cite sources or say "in my experience".
- Label AI output in examples as AI output, the same way the book asks readers to.

## Chapter status

| # | Chapter | Status | Words (target) |
|---|---------|--------|----------------|
| — | [Preface](front-matter/preface.md) | first draft (~1,400) | 1,500 |
| 1 | [Why checklists fail](chapters/01-why-checklists-fail.md) | revised (~4,500) | 6,000 |
| 2 | [Evidence and epistemics](chapters/02-evidence-and-epistemics.md) | revised (~5,000) | 7,000 |
| 3 | [Collecting Azure evidence read-only](chapters/03-collecting-azure-evidence.md) | revised (~4,700) | 8,000 |
| 4 | [Identity and privilege paths](chapters/04-identity-and-privilege-paths.md) | revised (~8,700) | 9,000 |
| 5 | [Network reachability](chapters/05-network-reachability.md) | revised (~6,800) | 7,000 |
| 6 | [Data flow: may access vs did access](chapters/06-data-flow.md) | revised (~4,800) | 6,000 |
| 7 | [Where LLMs help](chapters/07-where-llms-help.md) | revised (~6,000) | 8,000 |
| 8 | [Where LLMs hurt](chapters/08-where-llms-hurt.md) | revised (~6,700) | 7,000 |
| 9 | [Advisory remediation](chapters/09-advisory-remediation.md) | revised (~5,600) | 6,000 |
| 10 | [Verification and outcome metrics](chapters/10-verification-and-metrics.md) | revised (~5,600) | 6,000 |
| 11 | [Governing the AI tooling itself](chapters/11-governing-the-ai-tooling.md) | revised (~6,000) | 6,000 |
| A | [Companion lab tenant](appendices/a-companion-lab.md) | first draft (~3,300 incl. code) | 4,000 |
| B | [Query cookbook](appendices/b-query-cookbook.md) | first draft (~4,500 incl. code) | 5,000 |
| C | [Prompt patterns](appendices/c-prompt-patterns.md) | first draft (~4,000 incl. code) | 4,000 |
| D | [Case study (optional)](appendices/d-case-study.md) | outline (needs owner facts and approval) | 4,000 |
| — | [Glossary](back-matter/glossary.md) | first draft (~2,400) | 2,500 |
| | **Total** | | **~97,000** |

Status values: `stub` → `outline` → `first draft` → `revised` → `reviewed` → `final`.

## Cadence

Target ~2,000 words per week (two 1,000-word sessions). First full draft in roughly 9 months.

## Building the PDF

From the repository root:

```bash
pip install markdown reportlab
python docs/book/tools/build_book_pdf.py
```

This writes [`Managing-Azure-Security-with-AI-draft.pdf`](Managing-Azure-Security-with-AI-draft.pdf) with a linked contents page and bookmarks. The cover takes its title and subtitle from the **Working title** and **Working subtitle** lines above.

- Files that still contain `[[OWNER: ...]]` placeholders are left out, and the cover names them. Pass `--include-unfinished` to render them anyway.
- The build stops if any fenced code line is longer than 100 characters, and lists each one by file and line. Fix the source; `--allow-long-lines` overrides. A JSON line holding a single long string value is exempt, because it can't be broken.
- Code uses a monospace TrueType font with box-drawing glyphs when one is installed (DejaVu Sans Mono or Consolas), otherwise Courier.
- Tests: `python -m unittest discover -s docs/book/tools -p "test_*.py"`. The PDF build test also needs `pypdf` and is skipped without it.

## Checking the listings

Every code listing with a `<!-- listing: ... -->` marker is a copy of a file under `lab/listings/` or `lab/queries/`. From the repository root:

```bash
python docs/book/tools/check_listings.py                         # each marked block equals its source
python -m unittest discover -s docs/book/lab/listings/python/tests
pwsh -NoProfile -File docs/book/tools/check_powershell_listings.ps1   # PowerShell 7 parse
python docs/book/tools/check_kql_listings.py                     # KQL structure only
python docs/book/tools/check_json_listings.py                    # JSON parse and strict schemas
```

CI runs all five. The Terraform check needs the `terraform` CLI and downloads the providers, so it runs locally only:

```bash
export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"   # optional; avoids re-downloading
mkdir -p "$TF_PLUGIN_CACHE_DIR"                                 # terraform ignores a missing cache folder
python docs/book/tools/check_terraform_listings.py [--terraform /path/to/terraform]
```

It runs `terraform fmt -check` on every listing, then `init -backend=false` and `validate`. Each lab snippet is validated inside a temporary copy of `lab/terraform`: a block that redeclares a lab resource goes into an override file, so a one-argument change merges into the lab's resource. Each subfolder of `lab/listings/terraform/` is a standalone module and is validated on its own. No Azure credentials are needed.

Two kinds of block are deliberately not synced: Appendix A's one-line `terraform.tfvars`, which is a setting the reader types rather than code, and the Mermaid diagrams, which are figures. Command lines in `text` blocks aren't synced either.
