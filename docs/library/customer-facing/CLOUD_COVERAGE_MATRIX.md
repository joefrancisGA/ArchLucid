# Cloud coverage matrix

ArchLucid’s **review workflow** (ingest evidence → apply policy packs → findings → decisions → sealed review record) is cloud-agnostic. **Deterministic rule depth** varies by cloud and is documented here — not implied to be equal on every provider.

**Sources:** `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md` (45 bundled packs), `DefaultPolicyPackCloudBaselineApplicator` (AWS/GCP packs auto-enable when a review targets that cloud), `archlucid-ui/src/lib/cloud-neutral-primary-copy.ts`.

## Coverage by capability

| Capability | Cloud-agnostic | Azure | AWS | GCP |
|------------|----------------|-------|-----|-----|
| Evidence ingest (brief, diagram, document) | Full | Full | Full | Full |
| Review / finalize / sealed review record workflow | Full | Full | Full | Full |
| Security architecture baseline pack | Full | Full | Full | Full |
| AI governance pack | Full | Full | Full | Full |
| FinOps / cost governance packs | Full | Full | Full | Full |
| Provider-neutral architecture-quality baselines (Reliability, Performance, Operational Excellence, Sustainability) | Full | Full | Full | Full |
| Well-Architected / Architecture Framework packs | — | Full curated (`waf-az-*`) | Full peer (`waf-aws-*`) | Full peer (`waf-gcp-*`) |
| CIS foundations benchmark packs | — | Full curated (`cis-az-*`) | Full peer (`cis-aws-*`) | Full peer (`cis-gcp-*`) |
| Landing zone / control-plane packs | — | Full curated (CAF/LZ) | Full peer (Control Tower) | Full peer (resource hierarchy) |
| Identity baseline packs | — | Full curated (Entra) | Full peer (IAM / Identity Center) | Full peer (Cloud IAM) |
| Resiliency / DR packs | — | Full curated | Full peer | Full peer |
| Serverless / PaaS security packs | — | Full curated | Full peer | Full peer |
| Data-layer security packs | — | Full curated | Full peer | Full peer |
| Default-enabled at tenant create | Cloud-neutral + Azure baseline | Yes (Azure WAF + CIS Azure with neutral packs) | Auto-enable on AWS-targeted review | Auto-enable on GCP-targeted review |
| Read-only inventory ZIP packager | — | Available | Available | Available |
| LLM-assisted topology / finding prose (when live model configured) | General | General | General | General |

**Cell meanings**

- **Full** — curated deterministic policy-pack rules ship for that capability/cloud.
- **Full peer** — AWS/GCP pack exists as a peer to the Azure curated pack (same category family; content is provider-specific).
- **General** — language-model reasoning over uploaded evidence; not a substitute for missing deterministic rules.
- **—** — not applicable (provider-specific row).

## Honest scope statement

ArchLucid works across clouds. Rule coverage by cloud is documented in this matrix. Azure packs are enabled by default at tenant create alongside cloud-neutral packs; AWS and GCP peer packs activate when a review targets that cloud. Do not read “cloud-neutral workflow” as “identical deterministic depth on every provider.”

## Related

- [Default policy packs — V1](../../go-to-market/DEFAULT_POLICY_PACKS_V1.md)
- In-app: cloud inventory and wizard copy from `CLOUD_NEUTRAL_PRIMARY_COPY`
