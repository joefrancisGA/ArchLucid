> **Scope:** For operators practicing support triage, routing, and evidence capture; not a full incident response plan or subsystem-specific deep runbook.

# Support triage drill (operator)

**Objective:** Practice routing customer-impacting issues to the right owner with evidence, without guessing at root cause.

**Assumptions:** ArchLucid API and UI are reachable; you have read access to logs, SQL (when applicable), and the customer’s tenant scope identifiers.

**Constraints:** Do not paste secrets, API keys, or full payloads into public tickets; use correlation IDs and redacted excerpts only.

## Roles

- **Dispatcher:** Owns the timeline, communication, and severity.
- **Resolver:** Owns technical diagnosis (may be same person in small teams).

## Severity sketch

- **SEV1:** Total loss of authority/commit path for multiple tenants, or confirmed data loss.
- **SEV2:** Degraded commit or execute for a single tenant; workaround exists.
- **SEV3:** Single-user workflow issue; no data risk.

## Triage checklist (15 minutes)

1. **Capture context**
   - UTC timestamp range, environment (prod/pilot), tenant id, workspace/project ids, run id(s), correlation ID from response headers.
2. **Classify the seam**
   - UI-only, API 4xx/5xx, background worker, SQL timeout, outbound integration (Confluence, ITSM webhook, AOAI), or auth.
3. **Health gates**
   - `GET /health/ready` (or load balancer equivalent); database connectivity; configured feature flags that gate the path.
4. **Reproduce narrowly**
   - Minimal API call or CLI (`archlucid status <runId>`, `archlucid trace <runId>`) scoped to the same tenant headers.
5. **Data-consistency signal (admin)**
   - `archlucid data-consistency orphans` with `ARCHLUCID_API_KEY` — spikes may explain phantom UI; follow org change process before `remediate --execute`.
6. **Escalation packet**
   - One-paragraph summary, timeline, suspected seam, what you tried, what you need next.

## Post-incident (same week)

- Link to runbook updates or monitoring gaps; if AOAI-related, note whether `scripts/Invoke-RealLlmEvidenceGate.ps1` would have caught it in pre-release.

## Incident readiness drill (dry-run)

Generate timestamped rehearsal artifacts (triage scenarios + customer update template) without live production access:

```powershell
archlucid support incident-readiness-drill --out ./_drill-evidence/support-incident
```

See also `docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`.

## Security / scalability / reliability / cost

- **Security:** Treat admin diagnostics and webhook secrets as highly sensitive; keep triage notes out of public channels.
- **Scalability:** Large tenants may need paginated queries — avoid unbounded exports during incidents.
- **Reliability:** Prefer idempotent retries on read-only probes before mutating remediation.
- **Cost:** Live AOAI drills consume tokens; keep them in gated environments.
