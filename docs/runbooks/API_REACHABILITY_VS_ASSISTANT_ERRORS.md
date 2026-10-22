> **Scope:** Operator troubleshooting — distinguish API/proxy outages from assistant stream failures (T1-5).

# API reachability vs review assistant errors

**Last reviewed:** 2026-06-07

## Taxonomy

| Symptom class | Typical cause | Architect workspace toast title |
| --- | --- | --- |
| API/proxy unreachable | `ArchLucid.Api` down, wrong `ARCHLUCID_API_BASE_URL`, or UI proxy 502 | **ArchLucid API unreachable** |
| API URL not configured | Missing `ARCHLUCID_API_BASE_URL` in UI dev env | **API URL not configured** |
| Network/transport | Browser cannot complete fetch to UI proxy | **Cannot reach ArchLucid API** |
| Assistant stream only | UseStream/SSE path failed; core API may still be healthy | **Review assistant unavailable** |

Implementation: `archlucid-ui/src/lib/api-error-toast-policy.ts` (Vitest: `api-error-toast-policy.test.ts`).

## Quick triage

1. `curl -s -o /dev/null -w "%{http_code}\n" "$ARCHLUCID_API_BASE_URL/health/live"` — if not **200**, fix API reachability first.
2. `archlucid doctor` or `archlucid onboard-preflight` against the same base URL.
3. If health is **200** but Explain/AI fails, treat as assistant-channel issue (agent mode, stream proxy, or model credentials).

## Related

- [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md)
- [`archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`](../../archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md)
