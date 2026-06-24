namespace ArchLucid.Application.Governance;

/// <summary>Outcome of validating a generated <c>CuratedRulesDocument</c> JSON object.</summary>
public sealed class CuratedRulesDocumentValidationResult
{
    public IReadOnlyList<string> Errors
    {
        get;
        init;
    } = Array.Empty<string>();

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = Array.Empty<string>();

    public bool IsValid => Errors.Count == 0;
}
