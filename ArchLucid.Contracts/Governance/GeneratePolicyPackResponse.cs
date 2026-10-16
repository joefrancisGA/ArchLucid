using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>AI-generated curated rules document JSON plus mandatory human-review disclaimer.</summary>
public sealed class GeneratePolicyPackResponse
{
    public string Disclaimer
    {
        get;
        set;
    } = DraftPolicyPackRuleResponse.DefaultDisclaimer;

    /// <summary>Full <c>CuratedRulesDocument</c> JSON (schemaVersion 1).</summary>
    public string CuratedRulesDocumentJson
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Non-blocking validation findings — generated packs always require human review.</summary>
    private IReadOnlyList<string> validationWarnings = [];

    public IReadOnlyList<string> ValidationWarnings
    {
        get => validationWarnings;
        set => validationWarnings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Always true for AI-generated packs; surfaced for OpenAPI consumers.</summary>
    public bool RequiresHumanReview
    {
        get;
        set;
    } = true;
}
