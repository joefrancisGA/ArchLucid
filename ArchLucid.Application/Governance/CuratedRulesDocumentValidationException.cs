namespace ArchLucid.Application.Governance;

/// <summary>Raised when generated curated rules JSON fails structural validation.</summary>
public sealed class CuratedRulesDocumentValidationException : Exception
{
    public CuratedRulesDocumentValidationException(IReadOnlyList<string> errors)
        : base(errors.Count > 0 ? string.Join("; ", errors) : "Curated rules document validation failed.")
    {
        Errors = errors;
    }

    public IReadOnlyList<string> Errors
    {
        get;
    }
}
