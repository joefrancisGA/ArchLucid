namespace ArchLucid.Application.Bootstrap;

/// <summary>Workspace B payloads: synthetic healthtech AI governance + regulated security findings (no PHI).</summary>
internal static partial class RegulatedScenarioWorkspaceSeed
{
    internal const string WhitelabelFirmDisplayName = "Meridian Advisory Group";

    internal const string WhitelabelClientEngagementTitle = "Alpine Health — AI Governance Engagement";

    internal const string WhitelabelLogoBlobReference = "demo-tenant/brand/meridian-advisory-placeholder-logo.svg";

    internal const string ManifestVersion = "meridian-alpine-regulated-demo-v1-manifest";

    private const string SystemName = "Alpine Patient Risk Scoring Platform";

    private static readonly DateTime SeedUtc = new(2026, 3, 18, 14, 45, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal static string ManifestVersionLiteral => ManifestVersion;
}
