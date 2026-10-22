namespace ArchLucid.Application.Bootstrap;

/// <summary>Fabricates Workspace A payloads (capture, evidence placeholders, governance-weighted findings, committed manifest).</summary>
internal static partial class ProductTourWorkspaceSeed
{
    private const string ManifestVersion = "northwind-product-tour-v1-manifest";
    private const string SystemName = "Cloud Platform";
    private static readonly DateTime SeedUtc = new(2026, 2, 10, 15, 0, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal static string ManifestVersionLiteral => ManifestVersion;
}
