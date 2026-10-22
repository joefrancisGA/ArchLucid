namespace ArchLucid.Api.Models;

/// <summary>Bounds for manifest summary generation (relationship fan-out, etc.).</summary>
public static class ManifestSummaryLimits
{
    /// <summary>Maximum relationships to include on manifest summary endpoints; applied by default when <c>maxRelationships</c> is omitted.</summary>
    public const int MaxRelationships = 1000;
}
