namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>A single Technology Ledger prose lint violation detected in synthesized artifact content.</summary>
public sealed class TechnologyLedgerArtifactLintFinding
{
    public string RuleId
    {
        get;
        init;
    } = string.Empty;

    public string ArtifactType
    {
        get;
        init;
    } = string.Empty;

    public string? ArtifactName
    {
        get;
        init;
    }

    public string Message
    {
        get;
        init;
    } = string.Empty;

    public string? MatchedToken
    {
        get;
        init;
    }
}
