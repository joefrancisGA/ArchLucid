> **Scope:** Contributor-reference — Integration guide for external/custom agent handlers — out-of-process webhook boundary, sample payloads aligned with `AgentResult`; not shipping code, MCP membrane specs, or in-host plugin APIs.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Custom agent handlers — out-of-process boundary

## 1. Objective

Give enterprise integrators a **clear, secure extension model** for plugging third-party agents into ArchLucid without loading arbitrary code inside the API or worker hosts.

## 2. Assumptions

- Custom handlers run in **customer-operated or partner-operated** environments with their own identity, scaling, and patching cadence.
- The authoritative pipeline still expects validated **`AgentResult`**-shaped JSON at integration boundaries (same semantics as built-in agents).

## 3. Constraints

- **In-process .NET assembly loading for custom agents is prohibited.** Third-party binaries must not be loaded into ArchLucid hosting processes.
- Transport must stay **out-of-process**: **HTTPS REST webhooks** (recommended default) or **gRPC** over TLS to a registered endpoint — both treated as untrusted network peers until mutually authenticated.
- Payloads must align with **`ArchLucid.Contracts.Agents.AgentResult`** (see repo) and existing REST/OpenAPI patterns; do not invent parallel result schemas.

## 4. Architecture overview

ArchLucid orchestration **delegates** an `AgentTask` to an external handler by issuing an HTTP/gRPC call to a **tenant-configured endpoint**. The handler executes domain-specific logic, then returns an **`AgentResult`** JSON document. The host validates schema, applies quality gates, and merges outcomes like any first-party agent — preserving **memory isolation** (handler crashes do not tear down the API) and aligning with **MCP-style** “tools live outside the kernel” posture.

## 5. Component breakdown

| Piece | Responsibility |
|-------|----------------|
| **Orchestration layer** | Issues tasks, correlates `runId` / `taskId`, enforces timeouts and tenant scope |
| **Custom handler (external)** | Computes claims, evidence refs, optional manifest deltas |
| **`AgentResult` schema** | Stable contract for success path |
| **Webhook security** | mTLS or signed requests (organization-specific); secrets via Key Vault / tenant secrets — never embedded in docs |

## 6. Data flow

1. Host resolves **task descriptor** → builds **invocation request** (includes correlation IDs and serialized task context).
2. **POST** (or gRPC unary) to handler URL with authenticated caller identity.
3. Handler responds with **`AgentResult`** JSON (or structured error mapped to pipeline semantics).
4. Host runs **`AgentResult`** parsing/schema validation → downstream manifest synthesis unchanged.

## 7. Security model

- **Trust boundary:** Handler endpoint is **outside** ArchLucid trust zone until authenticated and authorized per tenant configuration.
- **Blast radius:** Compromise of a handler leaks **only** what credentials that endpoint holds — not sibling tenants inside ArchLucid memory space (no shared in-process heap).
- **Prohibited:** Shipping NuGet/plugin DLL drop-ins, `Assembly.LoadFrom` agent packs, or executing arbitrary scripts submitted through agent registration APIs without a separate hardened sandbox (not part of V1).

## 8. Operational considerations

- Define **SLAs**, retries, and **idempotency keys** using `taskId` / `resultId` so duplicate deliveries do not double-apply deltas.
- Cap payload sizes and reasoning trace length at ingress per tenant policy (mirror production defaults used for LLM-backed agents).

---

## Sample JSON — webhook invocation request (illustrative)

ArchLucid → handler (minimal envelope; **exact fields may evolve** — rely on OpenAPI when published):

```json
{
  "schemaVersion": "1.0",
  "invocationId": "e19f9f8d7d6d4f8b9e7c6b5a40332211",
  "runId": "7f6e5d4c3b2a109876543210fedcba98",
  "taskId": "aabbccddeeff00112233445566778899",
  "agentType": "Topology",
  "requestedAtUtc": "2026-05-14T12:34:56Z",
  "callbackHints": {
    "tenantDisplayName": "Contoso Pilot",
    "evidencePackUri": "https://api.example.invalid/internal/evidence/aabb"
  }
}
```

## Sample JSON — webhook response body (`AgentResult` aligned)

Handler → ArchLucid (`agentType` matches `ArchLucid.Contracts.Common.AgentType`; JSON uses camelCase consistent with ASP.NET Core defaults):

```json
{
  "resultId": "0123456789abcdef0123456789abcdef",
  "taskId": "aabbccddeeff00112233445566778899",
  "runId": "7f6e5d4c3b2a109876543210fedcba98",
  "agentType": "Topology",
  "claims": [
    "Dedicated subnet per workload tier improves blast-radius containment.",
    "Azure Firewall policy aligns with governance pack GP-001."
  ],
  "evidenceRefs": ["policy:GP-001", "catalog:subnet-pattern-standard"],
  "confidence": 0.82,
  "findings": [],
  "proposedChanges": null,
  "reasoningTrace": "Matched workload tiers to catalog patterns; excluded conflicting legacy spoke.",
  "citations": null,
  "createdUtc": "2026-05-14T12:35:10Z"
}
```

**Integration rule:** External handlers **must** return JSON compatible with **`AgentResult`** validation rules enforced by `AgentResultParser` (schema validation options apply per environment).
