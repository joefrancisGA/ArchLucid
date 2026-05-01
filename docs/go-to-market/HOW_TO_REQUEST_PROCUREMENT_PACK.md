> **Scope:** How buyers and field teams obtain the ArchLucid procurement documentation ZIP.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# How to request the procurement pack

## Who this is for

- **Buyers / procurement** requesting a single documentation drop.
- **Sales engineering / customer success** assembling a diligence bundle without hand-picking Markdown paths.

## One command (recommended)

From a clone of the ArchLucid repository (with the .NET SDK and **Python 3** installed):

```bash
archlucid procurement-pack --out archlucid-procurement-pack.zip
```

```powershell
archlucid procurement-pack --out .\archlucid-procurement-pack.zip
```

The command runs `scripts/build_procurement_pack.py`, verifies **every canonical file** exists, writes `dist/procurement-pack/` (staging) and the ZIP. Inside the ZIP you will find:

- `manifest.json` — each file’s **size** and **SHA-256**
- `versions.txt` — **git commit**, build timestamp, and **CLI package version**
- `redaction_report.md` — repository paths **intentionally omitted** from the canonical checklist and why

### Validate without writing a ZIP (CI / pre-commit)

```bash
python scripts/build_procurement_pack.py --dry-run
```

## Script-only (advanced)

```bash
./scripts/build_procurement_pack.sh
```

```powershell
./scripts/build_procurement_pack.ps1
```

Both wrappers invoke the same Python builder.

## Placeholder strictness (owner policy)

**Strict** checks for buyer-unsafe placeholders (for example unresolved `TODO` / `TBD` in packaged Markdown) apply **only** when producing a **release** or **procurement** artifact — the build path you use to ship `dist/procurement-pack.zip` to a buyer — **not** on every repository CI job. **Default CI** may still run `build_procurement_pack` to prove the bundle **assembles**; **do not** make merge-blocking gates depend on draft markers inside templates until a dedicated release/procurement job enforces cleanup.

## After generating the ZIP

1. Complete a buyer-specific cover letter using [`PROCUREMENT_PACK_COVER.md`](PROCUREMENT_PACK_COVER.md) **outside** the committed tree (see scaffold warnings there).
2. Send the ZIP **or** upload it to the buyer’s secure file exchange — do not email large binaries to unauthenticated mailboxes.

## Trust Center index

For narrative context and deep links, start at [`TRUST_CENTER.md`](TRUST_CENTER.md).
