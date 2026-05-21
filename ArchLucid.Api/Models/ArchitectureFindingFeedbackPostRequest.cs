using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class ArchitectureFindingFeedbackPostRequest
{
    /// <summary>Architecture run that owns the finding (required for tenant-scoped persistence).</summary>
    public Guid RunId
    {
        get;
        set;
    }

    public bool IsHelpful
    {
        get;
        set;
    }

    public string? Comment
    {
        get;
        set;
    }
}
