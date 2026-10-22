using System.IO;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Bootstrap;

internal static partial class ProductTourWorkspaceSeed
{
    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunGuid)
    {
        string suffix = authorityRunGuid.ToString("N");

        return new List<Finding>
        {
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-ingress",
                FindingType = "ComplianceReview",
                Category = "SecurityArchitectureBaseline",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Container Apps external ingress exposes admin callbacks without segmented jump-host paths",
                Rationale =
                    "Security baseline rule sec-base-003 expects hardened ingress for admin-plane traffic. Demonstration attachments "
                    + "summarize ACA environments that still advertise broad interim allowlists while migration completes.",
                PolicyRuleId = "sec-base-003",
                RecommendedActions = ["Shrink allowlisted source ranges", "Add JIT admin hops via bastion-aligned spoke subnets"],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision ACCEPT_RISK with Defender alert + CAB attestation prerequisites.",
                ReviewedByUserId = "architecture.board@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-privatelink",
                FindingType = "ComplianceReview",
                Category = "Networking",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "PaaS data planes inconsistently invoke private endpoints across demo subscriptions",
                Rationale =
                    "Rule sec-base-007 flags optional public Cosmos endpoints lingering in mirrored sandboxes alongside production peers.",
                PolicyRuleId = "sec-base-007",
                RecommendedActions =
                [
                    "Reuse platform Bicep modules that deny public endpoints in non-authoring environments",
                    "Apply Azure Policy deploy-if-not-exists for resilient private endpoints",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes =
                    "Recorded decision REMEDIATE — template backlog merges before evaluator refresh window completes.",
                ReviewedByUserId = "csp.platforms@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(12),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-kv-rotation",
                FindingType = "ComplianceReview",
                Category = "Secrets",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "Key Vault purge protection disabled on non-prod clones that hydrate demo datasets",
                Rationale =
                    "Rule sec-base-012 expects parity safeguards when clones mirror production classifications even for evaluator tenants.",
                PolicyRuleId = "sec-base-012",
                RecommendedActions =
                [
                    "Toggle purge-protection on vaulted clones referencing production-derived datasets",
                    "Automate KV drift scanners into weekly posture exports",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-log-forwarding",
                FindingType = "OperationalReview",
                Category = "Observability",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Central SIEM forwarding delays occasionally exceed tightened tier-1 SLO drafts",
                Rationale =
                    "Rule sec-base-020 reinforces timely evidence streaming; seeded metrics narrate illustrative spikes under tour load envelopes.",
                PolicyRuleId = "sec-base-020",
                RecommendedActions =
                [
                    "Tune Event Hub TU ahead of scripted evaluator peaks",
                    "Publish workbook comparing SLA vs observed ingest latency",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision DEFER uplift for synthetic subscription — documented variance with stakeholders.",
                ReviewedByUserId = "sre.observability@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(18),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-review-gate",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Human escalation matrix lacks after-hours reviewer for Tier-3 model releases",
                Rationale =
                    "Rule ai-gov-008 expects staffed dual-review coverage; seeded questionnaire cites single Friday engineer on-call roster.",
                PolicyRuleId = "ai-gov-008",
                RecommendedActions =
                [
                    "Mirror Entra privileged access groups for escalation coverage",
                    "Publish human-in-loop SLAs beside manifest DecisionTrace linkage",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["policyPackTheme"] = "ai-governance-responsible-ai-v1",
                    },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision REMEDIATE — playbook update scheduled ahead of externally hosted demos.",
                ReviewedByUserId = "trusted-ai.mesh@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(30),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-model-registry",
                FindingType = "ComplianceReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Model registry skips adapter hashing for rapid playground refreshes",
                Rationale =
                    "Rule ai-gov-014 expects attributable adapter lineage — synthetic uploads intentionally omit LoRA payloads for readability.",
                PolicyRuleId = "ai-gov-014",
                RecommendedActions =
                [
                    "Store adapter checksum blobs alongside manifests",
                    "Produce weekly drift diff for promoted adapter weights",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["policyPackTheme"] = "ai-governance-responsible-ai-v1",
                    },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
        };
    }

    internal static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");

        return new List<CanonicalObject>
        {
            EvidenceDoc(
                seed,
                "northwind-azure-subscription-inventory.pdf",
                "Synthetic inventory of Azure subscription 00000000-0000-0000-demo-000001 with App Service, APIM, Container Apps, Cosmos, Key Vault."),
            EvidenceDoc(seed, "contoso-cloud-context-diagram-v3.pdf", "Landing zone topology overlay for synthetic Cloud Platform workloads."),
            EvidenceDoc(seed, "northwind-decision-record-dr0029.pdf", "Decision memo — segmented AI batch spoke egress patterns."),
            EvidenceDoc(seed, "security-questionnaire-responses-synthetic.xlsx", "Completed baseline questionnaire mapped to Pack B controls."),
            EvidenceDoc(seed, "responsible-ai-readiness-checklist.json", "Checklist excerpts aligned with Pack A (NIST AI RMF thematic mapping)."),
            EvidenceDoc(seed, "cost-footprint-estimate.md", "Illustrative FinOps appendix for evaluator-only SKU mix."),
            EvidenceDoc(seed, "operations-runbook-excerpt.txt", "Synthetic alerting narrative for inference tier regressions."),
        };
    }

    private static CanonicalObject EvidenceDoc(string seed, string filename, string summary)
    {
        return new CanonicalObject
        {
            ObjectType = "evidence_attachment",
            Name = filename,
            SourceType = "product-tour-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firmLabel"] = "Product Tour reviewer (synthetic)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
