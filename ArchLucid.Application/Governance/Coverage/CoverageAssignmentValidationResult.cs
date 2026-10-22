namespace ArchLucid.Application.Governance.Coverage;

/// <summary>Non-throwing validation outcome for <see cref="CoverageAssignmentValidator" />.</summary>
public sealed class CoverageAssignmentValidationResult
{
    public CoverageAssignmentValidationResult(IReadOnlyList<string> errors)
    {
        Errors = errors ?? throw new ArgumentNullException(nameof(errors));
        IsValid = Errors.Count == 0;
    }

    public bool IsValid
    {
        get;
    }

    public IReadOnlyList<string> Errors
    {
        get;
    }

    public static CoverageAssignmentValidationResult Success() =>
        new(Array.Empty<string>());
}
