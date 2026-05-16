namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>Display metadata for first-party default policy packs seeded at tenant provisioning.</summary>
public static class DefaultPolicyPackCatalog
{
    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.AiGovernanceResponsibleAiV1Json" />.</summary>
    public const string AiGovernanceDisplayName = "AI Governance / Responsible AI";

    /// <summary>Matches <c>pack.description</c> for the AI governance template.</summary>
    public const string AiGovernanceDescription =
        "Starter baseline for AI/ML asset governance — model inventory, data handling, human oversight, and risk classification. Maps to NIST AI RMF v1.0 themes and EU AI Act high-risk categories. Not a compliance certification.";

    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.SecurityArchitectureBaselineV1Json" />.</summary>
    public const string SecurityBaselineDisplayName = "Security Architecture Baseline";

    /// <summary>Matches <c>pack.description</c> for the security baseline template.</summary>
    public const string SecurityBaselineDescription =
        "Starter security posture checks for cloud architecture reviews — identity, network, encryption, logging, and secure SDLC. Aligned to CIS Azure Foundations and OWASP ASVS themes. Not an exhaustive compliance assessment.";
}
