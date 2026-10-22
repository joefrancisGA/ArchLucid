using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Bootstrap;

internal static partial class RegulatedScenarioWorkspaceSeed
{
    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunGuid)
    {
        string suffix = authorityRunGuid.ToString("N");

        return new List<Finding>
        {
            new()
            {
                FindingId = $"regulated-demo-{suffix}-sb-public-infer",
                FindingType = "ComplianceReview",
                Category = "SecurityArchitectureBaseline",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Inference gateway still advertises interim public listener for partner smoke tests",
                Rationale =
                    "Rule sec-base-006 flags workloads that still rely on implicit public access where segmented landing zones expect Private Link or firewall constraints; "
                    + "the interim dual-homed inference listener mirrors that gap for evaluator demos.",
                PolicyRuleId = "sec-base-006",
                RecommendedActions =
                [
                    "Remove public ingress on production profiles; route partners through private APIM + Microsoft Entra claims",
                    "Attach conditional access context to scoring APIs",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision REMEDIATE — Meridian backlog item ALP-441 severs public listener before external pilot.",
                ReviewedByUserId = "security.architecture@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(4),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-model-versioning",
                FindingType = "ComplianceReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Error,
                Title = "Promoted scoring ensemble lacks immutable lineage hash between registry and deployment slot",
                Rationale =
                    "Rule ai-gov-002 expects checksum parity across registry, packaging, and inference slots; fixture narrates a gap during blue/green swap.",
                PolicyRuleId = "ai-gov-002",
                RecommendedActions =
                [
                    "Emit digest attestation in manifest DecisionTrace before promotion",
                    "Fail pipeline when registry artifact hash != deployed image signature",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision REMEDIATE — ML platform owners scheduled within synthetic sprint window.",
                ReviewedByUserId = "trusted-ai.lead@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-drift",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Drift monitors defined but not wired to sponsor escalation for weekend scoring releases",
                Rationale = "Rule ai-gov-011 expects automated drift routing; synthetic config references dormant action groups.",
                PolicyRuleId = "ai-gov-011",
                RecommendedActions =
                [
                    "Bind Azure Monitor alert rules to incident bridge + on-call roster",
                    "Add manifest-controlled drift thresholds per cohort slice",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-human-gate",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Tier-3 model promotion lacks dual human attestation artifacts in seeded workflow",
                Rationale = "Rule ai-gov-008 expects staffed escalation matrix with signed attestations archived to evidence.",
                PolicyRuleId = "ai-gov-008",
                RecommendedActions =
                [
                    "Attach attestation bundle IDs on each promotion PR",
                    "Mirror Entra PIM elevations with reviewer parity",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision ACCEPT_RISK contingent on interim CAB minutes stored in Meridian vault replica.",
                ReviewedByUserId = "clinical.safety.liaison@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(18),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-vendor-model",
                FindingType = "ComplianceReview",
                Category = "ThirdPartyRisk",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Vendor foundation model DPIA appendix incomplete for alpine-specific jurisdictions",
                Rationale =
                    "Rule ai-gov-026 flags missing jurisdiction addenda when third-party base models underpin regulated scoring tiers.",
                PolicyRuleId = "ai-gov-026",
                RecommendedActions =
                [
                    "Upload vendor attestation pack with data residency matrix",
                    "Record compensating controls in DecisionTrace",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-sb-encryption",
                FindingType = "ComplianceReview",
                Category = "DataProtection",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "Training lake encryption-at-rest parity lagged on archival tier for synthetic PHI-like tags",
                Rationale =
                    "Rule sec-base-011 expects EncryptionAtRestRequired and CMK posture consistency when labels imply restricted payloads — demo narrates remediation backlog.",
                PolicyRuleId = "sec-base-011",
                RecommendedActions =
                [
                    "Attach customer-managed keys to archival storage accounts",
                    "Automate defender scan for permissive SAS tokens",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision WAIVE_CONDITIONAL pending FinOps-approved CMK budget line (synthetic SKU).",
                ReviewedByUserId = "data.protection@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(22),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-doc-drift",
                FindingType = "OperationalReview",
                Category = "Documentation",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Model card narrative omits adapter provenance for rapid playground refreshes",
                Rationale =
                    "Rule ai-gov-014 expects adapter checksum references; synthetic fast refresh path skipped heavy attachments for readability.",
                PolicyRuleId = "ai-gov-014",
                RecommendedActions =
                [
                    "Attach adapter digest SHA256 to registry metadata",
                    "Publish weekly diff for promoted adapters",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-monitoring-config",
                FindingType = "OperationalReview",
                Category = "Observability",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Monitoring workbook references placeholder subscription IDs for drift burn-down charts",
                Rationale = "Rule ai-gov-033 encourages alignment between monitoring assets and manifest references.",
                PolicyRuleId = "ai-gov-033",
                RecommendedActions =
                [
                    "Bind workbooks to canonical landing zone resource IDs",
                    "Tag dashboards with engagement code ALPINE-MER-01",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision DEFER uplift until external evaluator tour refresh.",
                ReviewedByUserId = "sre.observability@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(28),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-sb-audit-trail",
                FindingType = "OperationalReview",
                Category = "Audit",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Immutable audit feed sampling interval widened during synthetic load tests",
                Rationale =
                    "Rule sec-base-018 expects subscription-level change auditing assumptions to stay timely for proof packs; fixture documents variance acceptable for sandbox hours only.",
                PolicyRuleId = "sec-base-018",
                RecommendedActions =
                [
                    "Tighten Event Hub capture interval post-demo",
                    "Mirror SIEM routing latency SLO in governance dashboard",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision DEFER — synthetic subscription only; production parity tracked separately.",
                ReviewedByUserId = "grc.audit@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(30),
                RunIdRef = suffix,
            },
        };
    }

    internal static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");

        return new List<CanonicalObject>
        {
            EvidenceDoc(seed, "alpine-model-registry-export.csv", "Synthetic AML model registry extract (ids redacted)."),
            EvidenceDoc(seed, "alpine-data-classification-matrix.xlsx", "Column-level labels {synthetic-restricted, internal-ml, public-synth}."),
            EvidenceDoc(seed, "meridian-human-review-process.pdf", "Human-in-the-loop gates for Tier-3 promotions (fabricated)."),
            EvidenceDoc(seed, "deployment-approval-workflow-screenshot.png", "Placeholder Change Advisory narrative for demo UI."),
            EvidenceDoc(seed, "vendor-risk-assessment-third-party-model.pdf", "Third-party foundation model questionnaire (synthetic)."),
            EvidenceDoc(seed, "monitoring-drift-config.yaml", "Azure Monitor + AML drift monitors (evaluator-safe)."),
            EvidenceDoc(seed, "training-pipeline-overview.md", "Batch + streaming training references without PHI samples."),
            EvidenceDoc(seed, "synthetic-fhir-schema-mapping.json", "Illustrative mapping doc — no real patient records."),
        };
    }

    private static CanonicalObject EvidenceDoc(string seed, string filename, string summary)
    {
        return new CanonicalObject
        {
            ObjectType = "evidence_attachment",
            Name = filename,
            SourceType = "regulated-demo-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firmLabel"] = $"{WhitelabelFirmDisplayName} (whitelabel demo)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
