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
}
