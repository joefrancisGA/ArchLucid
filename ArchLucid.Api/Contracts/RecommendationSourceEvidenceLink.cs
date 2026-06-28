using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
///     Navigable evidence anchor for a persisted advisory recommendation (finding or manifest section).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class RecommendationSourceEvidenceLink
{
    public string Kind
    {
        get;
        set;
    } = null!;

    public string Id
    {
        get;
        set;
    } = null!;
}
