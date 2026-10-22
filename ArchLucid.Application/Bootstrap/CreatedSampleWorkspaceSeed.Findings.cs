using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Bootstrap;

internal static partial class CreatedSampleWorkspaceSeed
{
    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunGuid)
    {
        string suffix = authorityRunGuid.ToString("N")[..12];

        return
        [
            new()
            {
                FindingId = $"created-{suffix}-private-inference-egress",
                FindingType = "SecurityReview",
                Category = "Network",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Inference path may traverse public egress before private link cutover completes",
                Rationale =
                    "Draft intake targets private Azure OpenAI and AI Search endpoints; interim dev subscriptions still allow managed public endpoints for playground refreshes.",
                PolicyRuleId = "sec-base-private-link-01",
                RecommendedActions =
                [
                    "Deny public network access on Azure OpenAI and AI Search resources",
                    "Validate private DNS zones resolve from orchestration spoke before production promotion",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-llm-workload" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-content-safety-gap",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Content safety filters not yet wired on APIM outbound policy chain",
                Rationale =
                    "Guided intake promises gateway-level abuse monitoring; policy templates still reference placeholder content-filter deployment slots.",
                PolicyRuleId = "ai-gov-content-safety-03",
                RecommendedActions =
                [
                    "Attach Azure AI Content Safety endpoint to APIM policy before workforce pilot",
                    "Document kill-switch tested each release train",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision REMEDIATE — safety hooks scheduled ahead of internal pilot cohort.",
                ReviewedByUserId = "trusted-ai.mesh@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-prompt-manifest-drift",
                FindingType = "OperationalReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "System prompt manifest lacks checksum attestation on rapid playground updates",
                Rationale =
                    "Creation workflow asserts prompt changes flow through approved pipeline; playground shortcuts bypass adapter hashing.",
                PolicyRuleId = "ai-gov-prompt-lineage-07",
                RecommendedActions =
                [
                    "Store prompt manifest checksum blobs alongside deployments",
                    "Publish weekly drift diff for promoted system prompts",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-index-redaction-coverage",
                FindingType = "ComplianceReview",
                Category = "DataHandling",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Vector index redaction patterns cover common PII formats but not custom employee IDs",
                Rationale =
                    "Ingestion pipeline design intent includes regex redaction; synthetic corpus omits bespoke HR identifier formats for readability.",
                PolicyRuleId = "sec-base-data-min-04",
                RecommendedActions =
                [
                    "Extend redaction rule pack with workforce identifier patterns",
                    "Sample index partitions weekly for residual secret leakage",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision ACCEPT_RISK for synthetic evaluator tenant — production would require HR pattern pack.",
                ReviewedByUserId = "privacy.ops@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(10),
                RunIdRef = suffix,
            },
        ];
    }
}
