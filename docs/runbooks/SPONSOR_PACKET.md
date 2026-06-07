> **Scope:** Operator — Generate a buyer-ready sponsor packet from one committed run.

# Sponsor packet (one command)

**Audience:** Pilot operators and sales engineers handing proof to sponsors.

**Last reviewed:** 2026-06-06

---

## When to run

After a run is **committed** and before external sponsor circulation. Review `limitations.md` inside the packet before send.

## Quickstart

```bash
archlucid sponsor-packet <runId> --out artifacts/sponsor-packet/<runId>
```

Optional ZIP:

```bash
archlucid sponsor-packet <runId> --out artifacts/sponsor-packet/<runId> --zip artifacts/sponsor-packet.zip
```

PowerShell wrapper (repo root):

```powershell
./scripts/Invoke-SponsorPacket.ps1 -RunId <committed-run-guid> -ZipPath artifacts/sponsor-packet.zip
```

Requires a reachable API (`ARCHLUCID_API_BASE_URL` or `.archlucid/config.json`) and scope credentials (`ARCHLUCID_API_KEY` when configured).

## Packet layout

Open **`index.md`** first. Core artifacts:

| File | Source |
|------|--------|
| `first-value-report.md` | `GET /v1/pilots/runs/{runId}/first-value-report` |
| `executive-review-packet.md` | `GET /v1/pilots/runs/{runId}/executive-review-packet` |
| `executive-summary.json` | `GET /v1/roi/executive-summary` (scope labels included) |
| `pilot-run-deltas.json` | Mirror of `run-evidence.json` (`GET /v1/pilots/runs/{runId}/pilot-run-deltas`) |
| `limitations.md` | Buyer-safe caveats (demo data, PilotStrict, deferred procurement gates) |
| `provenance-references.json` | Audit + artifact ids (no payloads) |
| `pack-manifest.json` | SHA-256 manifest for deterministic regeneration checks |

The command reuses `archlucid pilot proof-packet` governance artifacts (audit summaries, redaction manifest, quote-to-proof readiness) and adds sponsor-facing files above.

## Related

- Broader first-pilot rollup: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- Email-sized ZIP (fewer files): `GET /v1/pilots/runs/{runId}/sponsor-proof-pack.zip` or `archlucid buyer-proof-pack`
- ROI semantics: [`PILOT_SCORECARD_API.md`](../library/PILOT_SCORECARD_API.md)
