using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class CoveragePreviewRequest
{
    public CloudProvider CloudProvider
    {
        get;
        init;
    } = CloudProvider.None;

    public bool FocusedPilotModeEnabled
    {
        get;
        init;
    } = true;

    public string? SecurityIntakeAnswer
    {
        get;
        init;
    }

    public string? DescriptionText
    {
        get;
        init;
    }

    public IReadOnlyList<CoveragePreviewUserOverrideRequest>? UserOverrides
    {
        get;
        init;
    }
}
