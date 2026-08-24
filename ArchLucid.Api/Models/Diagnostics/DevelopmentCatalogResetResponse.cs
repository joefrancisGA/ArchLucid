namespace ArchLucid.Api.Models.Diagnostics;

/// <summary>Result for <c>POST /v1/diagnostics/reset-development-catalog</c>.</summary>
public sealed class DevelopmentCatalogResetResponse
{
    public required string CatalogName { get; init; }

    public bool DemoSeedApplied { get; init; }
}
