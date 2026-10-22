using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Application.Governance.Coverage;

internal sealed record ContextualPolicyPackRecommendation(
    string PackDisplayName,
    RecommendationConfidence Confidence,
    string TriggerKey,
    string Rationale,
    string TriggeringEvidenceRef);

/// <summary>Deterministic, table-driven contextual pack recommendations (no LLM selection).</summary>
internal static class ContextualPolicyPackRecommender
{
    private const string HipaaDisplayName = "HIPAA / HITECH Safeguards";
    private const string PciDisplayName = "PCI-DSS (Architecture / Segmentation)";
    private const string GdprDisplayName = "GDPR Compliance Baseline";
    private const string AiGovernanceDisplayName = DefaultPolicyPackCatalog.AiGovernanceDisplayName;
    private const string ZeroTrustDisplayName = DefaultPolicyPackCatalog.ZeroTrustArchitectureDisplayName;

    internal static IReadOnlyList<ContextualPolicyPackRecommendation> Recommend(CoveragePreviewInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        List<ContextualPolicyPackRecommendation> recommendations = [];
        string securityAnswer = input.SecurityIntakeAnswer?.Trim() ?? string.Empty;
        string description = input.DescriptionText?.Trim() ?? string.Empty;
        string combined = $"{securityAnswer}\n{description}".ToLowerInvariant();

        if (ContainsAny(combined, ["phi", "hipaa", "hitech", "health record", "medicaid", "medicare"]))
        {
            recommendations.Add(
                new ContextualPolicyPackRecommendation(
                    HipaaDisplayName,
                    RecommendationConfidence.High,
                    "intake.phi-or-healthcare",
                    "Healthcare or PHI scope was stated in intake — HIPAA / HITECH safeguards are recommended.",
                    "l0.pillar.security"));
        }

        if (ContainsAny(combined, ["pci", "payment card", "cde", "cardholder"]))
        {
            recommendations.Add(
                new ContextualPolicyPackRecommendation(
                    PciDisplayName,
                    RecommendationConfidence.High,
                    "intake.pci",
                    "Payment-card or PCI scope was stated — PCI-DSS segmentation guidance is recommended.",
                    "l0.pillar.security"));
        }

        if (ContainsAny(combined, ["pii", "gdpr", "personal data", "data subject"]))
        {
            recommendations.Add(
                new ContextualPolicyPackRecommendation(
                    GdprDisplayName,
                    RecommendationConfidence.High,
                    "intake.pii-or-gdpr",
                    "Personal data or GDPR scope was stated — privacy baseline is recommended.",
                    "l0.pillar.security"));
        }

        if (ContainsAny(combined, ["machine learning", "ml model", "large language", "generative ai", " llm", "foundation model", "ai workload"]))
        {
            recommendations.Add(
                new ContextualPolicyPackRecommendation(
                    AiGovernanceDisplayName,
                    RecommendationConfidence.High,
                    "intake.ai-workload",
                    "AI or ML workload themes were stated — responsible AI governance is recommended.",
                    "description"));
        }

        if (ContainsAny(combined, ["internet-facing", "public endpoint", "zero trust", "ztna"]))
        {
            recommendations.Add(
                new ContextualPolicyPackRecommendation(
                    ZeroTrustDisplayName,
                    RecommendationConfidence.Medium,
                    "intake.internet-exposure",
                    "Internet-facing or zero-trust themes were stated — zero trust architecture guidance may apply.",
                    "description"));
        }

        return recommendations
            .GroupBy(row => row.PackDisplayName, StringComparer.Ordinal)
            .Select(group => group.First())
            .OrderBy(row => row.PackDisplayName, StringComparer.Ordinal)
            .ToList();
    }

    private static bool ContainsAny(string text, IReadOnlyList<string> needles)
    {
        foreach (string needle in needles)
        {
            if (text.Contains(needle, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
