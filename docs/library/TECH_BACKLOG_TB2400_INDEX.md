> **Scope:** Contributor-reference — option-preserving API split follow-on **TB-2400**–**TB-2401** (former Composer holds **OP-07** / **OP-08**). Merge into `TECH_BACKLOG.md` summary table + detail sections when that file is stable. Not a buyer or operator document.

# Option-preserving API split — second host + catalog split (TB-2400–TB-2401)

**Opened:** 2026-09-10. Owner ask: promote Composer holds **OP-07** (second HTTP host) and **OP-08** (catalog / DDL split) to technical backlog items after **OP-01**–**OP-06** shipped on branch `cursor/option-preserving-api-prompts-3024`.

**Thesis:** Architecture and SecureNow remain **one API + one Worker + one SQL catalog** until these rows are explicitly picked up. **OP-01**–**OP-06** delivered the modularization graph (capability map, namespace ratchet, product-line signal, route 403 gate, four composition facades, worker hosted-service map). **TB-2400** is a **compile-check** second web project — not a clone of `AddArchLucidApplicationServices`. **TB-2401** is the **last** cut: named integration contract + one DDL file **per surviving database** — not gradual dual-write on day one.

**Prerequisites (Done — do not re-run as OP sessions):** **OP-01** `product-capability-map.json`; **OP-02** namespace allowlist + ratchet; **OP-03** `ProductLine:Deployment` + optional `X-ArchLucid-Product-Line`; **OP-04** route gate; **OP-05** `AddPlatformCapability` / `AddAuthorityCapability` / `AddInfraEvidenceCapability` / `AddGovernanceCapability`; **OP-06** `product-capability-worker-map.json`. Canonical prompts: [`OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md`](../architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md).

**Do not implement without owner pickup of the matching TB row:** Do **not** add `SecureNow.Api`, `ArchLucid.Host.Security`, a second Worker, `ArchLucid.SecureNow.sql`, split DbUp journals, or long-lived `architecture` vs `security` git branches from agent sessions. **PL-05** (one API, two UI shells) stays in force until **TB-2400** ships. **ADR 0037** tenant-catalog model stays until **TB-2401** ships with an explicit anti-corruption / events story.

**Ship order:** **TB-2400** only after owner directs that row (compile fail on `AddAuthorityCapability` / `Application.Runs`). **TB-2401** only after **TB-2400** decision record **or** a separate owner reopen that quotes integration-contract scope — never implied by **TB-2400** alone.

| ID | Title | Quality | Pri | Window | Size |
| --- | --- | --- | --- | --- | --- |
| TB-2400 | Second HTTP host compile check (`SecureNow.Api` facade-only references) | Architectural integrity | P2 | V1.1 | L |
| TB-2401 | Product-line catalog / DDL split (last; named integration contract) | Architectural integrity | P2 | V2 | XL |

---

## TB-2400 — Second HTTP host compile check (OP-07) (P2) — **V1.1**

**Window:** V1.1 — post-modularization extract option. **Not** V1 GA scope.

**Priority:** P2.

**Source:** Composer **OP-07** promoted to backlog 2026-09-10. Paste prompt: [`.cursor/prompts/option-preserving-api-07-second-host-hold.md`](../../.cursor/prompts/option-preserving-api-07-second-host-hold.md).

**Problem:** A second Kestrel host that still calls monolithic `AddArchLucidApplicationServices` is a deploy clone, not an extract. Without a compile-time proof that a SecureNow-facing host can reference only platform + infra-evidence + governance facades, teams will fork `Program.cs` early and double auth/health/OpenAPI while SQL + Worker remain shared.

**Approach:**

1. Confirm **OP-01**–**OP-06** artifacts green (map, ratchet, signal, 403 gate, four facades, worker map).
2. Add a **named branch** web project (e.g. compile-check only; may ship as solution filter, not production deploy).
3. Project references **only** `AddPlatformCapability`, `AddInfraEvidenceCapability`, `AddGovernanceCapability` — **must fail to compile** if it references `AddAuthorityCapability`, `Application.Runs`, or authority-only modules.
4. **One** DbUp migrator process; **one** `ArchLucid.sql` journal (**TB-2401** not reopened).
5. **One** `ArchLucid.Worker` unless a separate Worker split is explicitly filed.

**Acceptance:** Compile-check project builds with facade subset; intentional `AddAuthorityCapability` reference fails CI; no second production Container App / Terraform worker split in the same PR; dual-start docs still describe one API until owner promotes deploy.

**Out of scope:** Production SecureNow API cutover; splitting SQL (**TB-2401**); INV-006 changes; second Next.js app; GTM **M-90** / **M-44** / **M-91** / **M-92**; **TB-135** / **TB-136** assurance programs.

**Peers:** `docs/architecture/data/composition-capability-registrars.md`, `docs/architecture/data/product-capability-map.json`, `docs/architecture/data/product-capability-worker-map.json`, ADR 0001 hosting roles, **PL-05**.

**Size estimate:** L.

---

## TB-2401 — Product-line catalog / DDL split (OP-08) (P2) — **V2**

**Window:** V2 — **last** in the option-preserving sequence. **Not** gradual-on-day-one.

**Priority:** P2.

**Source:** Composer **OP-08** promoted to backlog 2026-09-10. Paste prompt: [`.cursor/prompts/option-preserving-api-08-catalog-split-hold.md`](../../.cursor/prompts/option-preserving-api-08-catalog-split-hold.md).

**Problem:** Two HTTP hosts on one `ArchLucid.sql` make the schema the unversioned API. Product-line table splits without an integration contract leave FKs across products and break the **one DDL file per database** rule.

**Approach (owner-directed session only — confirm before code):**

1. Table inventory: which entities move vs stay in shared identity/platform catalog.
2. Replace cross-product FKs with events, replicated keys, or an explicit anti-corruption layer.
3. **One** migrator; tenant provisioning still `SystemWithPerTenantCatalogs` per **customer** — confirm hybrid if both products share a paying tenant.
4. **One DDL file per surviving database** (`ArchLucid.sql` + DbUp `Migrations/` per DB).
5. Quote **TB-2400** separately if both host and catalog splits are in scope.

**Acceptance:** Named integration contract doc; migration plan with zero dual-write “temporary” FKs; no ADR 0037 RLS revival as product-line boundary; no `ArchLucid.SecureNow.sql` without the above contract.

**Out of scope:** Starting from **OP-07** hold text alone; splitting migrations by product folder; two DbUp journals against one `SchemaVersions` table; buyer claims of separate SecureNow platform before artifacts exist.

**Peers:** `docs/library/SQL_SCRIPTS.md`, `ArchLucid.Persistence/Scripts/ArchLucid.sql`, ADR 0037, `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc`, **TB-2400**.

**Size estimate:** XL.
