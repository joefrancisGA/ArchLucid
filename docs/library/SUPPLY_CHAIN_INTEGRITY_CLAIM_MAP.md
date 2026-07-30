> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Supply-chain integrity — NuGet/npm provenance, SBOM, pipeline tamper resistance

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1521** / GTM **M-279**. Pair honesty CI **TB-1522** / **M-279**.

**Verdict (one line):** ArchLucid has a **credible DevSecOps scanning floor** (Dependabot, npm lockfile + `npm ci`, NuGet CPM pins, CycloneDX SBOM *CI artifacts*, Trivy, Gitleaks, CodeQL, Azure CD OIDC + digest deploy) but **not** a modern SLSA / package-provenance / signed-image story — and several trust/assurance claims **imply merge-blocking or customer-ready supply-chain maturity** that the tiered CI model does not deliver.

---

## 1. Control matrix (shipped vs gap)

| Control | Shipped | Gap / honesty note |
|---------|---------|-------------------|
| **NuGet version pin** | Central Package Management (`Directory.Packages.props`, transitive pinning) | **No** `packages.lock.json`; **no** PackageSourceMapping / trustedSigners |
| **NuGet High/Critical gate** | Script `scripts/ci/assert_nuget_no_high_critical_vulnerabilities.py` exists | **Not referenced under `.github/workflows/`** — CAIQ/BUILD “merge-blocking” claim is **unwired** |
| **npm lockfile** | `archlucid-ui/package-lock.json` + CI `npm ci` | **No** npm provenance / Sigstore publish attestations |
| **npm audit** | Weekly `ui-npm-audit-weekly.yml` (Done **TB-864**) | Scheduled telemetry — **not** a PR merge gate |
| **SBOM** | CycloneDX .NET + npm as full-CI Actions artifacts | Warn-only / skipped on trimmed PR; **not** customer-published; BuildKit `sbom: false` on image builds |
| **Image signing** | Digests + OCI labels; CD prefers `@sha256:` | **No** cosign / Notation / Sigstore verify-at-deploy |
| **Build provenance / SLSA** | — | BuildKit `provenance: false` / `sbom: false` on CI smoke + CD push paths |
| **CI/CD OIDC** | Azure login OIDC on CD / staging / several nightlies | Strong **cloud access** story — **≠** build attestation |
| **Dependabot** | nuget / npm / actions / terraform / docker | Opens PRs — **not** a vulnerability merge gate by itself |
| **Gitleaks / CodeQL** | Tier 0 / separate workflow on PR | Real merge-path security floor |
| **Trivy IaC** | On Terraform validate (PR path) | Stronger PR gate than image Trivy |
| **Trivy container** | Inside `docker-build-smoke` CRITICAL/HIGH fixable | Full CI / dispatch — **not** trimmed PR path (see `.github/BRANCH_PROTECTION.md`) |
| **Deploy tamper resistance** | `BUILD_ID` = git SHA; digest deploy; lineage scripts (Done **TB-657** / **TB-756**) | Tag mutability reduced; **not** cryptographic publisher authenticity |
| **NuGet.org publish** | API key (`NUGET_API_KEY`) | Weaker than trusted publishing / OIDC |

Do **not** confuse product `ArchLucid.Provenance` (decision/evidence lineage) with software supply-chain provenance.

---

## 2. Trust-center / assurance claims that depend on this (explicit vs only implicit)

| Claim surface | What it says | Depends on supply-chain story? | Explicit or only implicit? |
|---------------|--------------|--------------------------------|----------------------------|
| [`ASSURANCE_STATUS_CANONICAL.md`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md) Trivy **container** “**Merge-blocking**” | Every PR/merge blocks on image CVEs | Yes — image Trivy gate | **Overstated** vs tiered CI (full CI only) |
| Same file SBOM “**Per-build artifact**” | Sounds release/customer-ready | Yes — CycloneDX publish story | **Implicit customer readiness**; actually internal Actions artifacts |
| Same file Dependabot “Automated PRs” | Correct as written | Partial | Explicit OK — readers often upgrade to “vulns blocked” |
| [`CAIQ_LITE_2026.md`](../security/CAIQ_LITE_2026.md) / [`BUILD.md`](../engineering/BUILD.md) NuGet `--vulnerable` merge-blocking | Documents wired CI step | Yes | **Doc/CI drift** — script unwired |
| [`trust-center.md`](../go-to-market/trust-center.md) “V1 assurance … plus **CI**” next to owner pen-test | CI = secure SDLC | Yes | **Implicit** full supply-chain maturity |
| [`BUYER_SECURITY_PROCUREMENT_PACKET.md#control-to-evidence-map`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#control-to-evidence-map) “Vulnerability scanning (CI) … Implemented” | Scanning exists | Yes | Explicit existence; **implicit** PR completeness |
| Evidence-packet template “supply-chain … from release bundle” | SBOM/signing in bundle | Yes | **Implicit** packaged SBOM/signing |
| Policy pack **“Software Supply Chain & SBOM”** | Reviews *customer* architectures | Conflation risk | **Implicit** that ArchLucid has a published SBOM program |
| `/trust` UI (`trust-center-*.ts`) | SOC / pen-test honesty ladder | Indirect | Explicit on CPA/3P; **silent** on SBOM/SLSA (good — keep silent until real) |
| [`WHAT_NOT_TO_PROMISE.md`](../go-to-market/WHAT_NOT_TO_PROMISE.md) | SOC 2 CPA forbidden | Adjacent | Explicit anti-attestation; **silent** on SBOM/SLSA overclaims |

---

## 3. Safe pin

> Dependabot, lockfiles/CPM, Gitleaks, CodeQL, Trivy IaC (PR), digest-based CD with Azure OIDC, and CycloneDX artifacts on full CI are the real floor. Do **not** sell: NuGet High/Critical as merge-blocking while unwired; customer-published SBOM; SLSA/BuildKit provenance (currently disabled); cosign-signed images; “every PR” container Trivy; npm provenance; Renovate-as-shipped. Digest deploy ≠ signed publish. Product Provenance ≠ supply-chain provenance.

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Merge-blocking Trivy on every PR” (images) | Image Trivy on full CI/dispatch; IaC Trivy on PR |
| “We publish SBOMs / SLSA attestations” | CycloneDX CI artifacts; BuildKit provenance/SBOM off |
| “NuGet High/Critical blocked in CI” | Script exists; **wire before claiming** |
| “Signed container supply chain” | Digest pin + ACR; no cosign verify |
| “OIDC = build provenance” | OIDC for Azure deploy auth only |
| “Dependabot means vulns can’t merge” | Dependabot opens PRs; gates are separate |
| “ArchLucid SBOM program” (via policy pack name) | Pack reviews customer architectures; not our publish program |

---

## 5. Related owners

| ID | Role |
|----|------|
| Done **TB-858**–**TB-865** / **TB-864** | UI supply-chain hygiene + weekly npm audit |
| Done **TB-657** / **TB-756** | CD image ownership / digest-unchanged |
| Open **TB-1144** / **M-196** | SOC/pen-test talk-track (adjacent assurance honesty) |
| Open **G-REAL-05** / **G-ASSURANCE-02** | CPA SOC 2 / 3P pen-test (owner) — do not reopen Done **TB-135**/**TB-136** |
| **TB-1521** / **M-279** | This supply-chain integrity claim map |

---

## 6. Optional engineering follow-ons (not required to close honesty pin)

1. Wire `assert_nuget_no_high_critical_vulnerabilities.py` into Tier 0 / PR CI **or** remove CAIQ/BUILD merge-blocking language.
2. Soften ASSURANCE “Merge-blocking” for container Trivy to match branch-protection tiers.
3. NuGet lockfiles + PackageSourceMapping; npm provenance when publishing; enable BuildKit provenance/SBOM intentionally.
4. Cosign/Notation sign + verify-at-deploy; customer SBOM download on trust center only after publish path exists.
5. Disambiguate product Provenance vs supply-chain provenance in trust/security copy.
