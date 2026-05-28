# Finding trust chips — operator UI

Per-finding trust chips render in **Quick decision summary** on review detail. Labels are derived from existing wire fields only:

| Chip | When |
| --- | --- |
| Evidence-backed | `evidenceRefCount > 0` and confidence is not Low |
| Low confidence | Evidence present but confidence is Low |
| Citation missing | No evidence references |
| Heuristic | No evidence references and confidence Low |

Component: `archlucid-ui/src/components/FindingTrustChip.tsx`.

Sponsor exports: trust posture remains in the run-level **Trust evidence** card and first-value report sections built by `FindingTrustEvidenceCardMarkdownFormatter`.
