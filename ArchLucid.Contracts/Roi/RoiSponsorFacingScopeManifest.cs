using System.Text.Json;

namespace ArchLucid.Contracts.Roi;

/// <summary>Loads the cross-surface ROI scope label manifest for parity checks and offline export fallbacks.</summary>
public static class RoiSponsorFacingScopeManifest
{
    private const string ManifestFileName = "roi-sponsor-facing-scope-labels.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static RoiSponsorFacingScopeManifestDocument Load()
    {
        string path = ResolveManifestPath();
        string json = File.ReadAllText(path);
        RoiSponsorFacingScopeManifestDocument? document =
            JsonSerializer.Deserialize<RoiSponsorFacingScopeManifestDocument>(json, JsonRead)
            ?? throw new InvalidOperationException($"ROI scope manifest is empty: {path}");

        return document;
    }

    public static string ResolveManifestPath()
    {
        string? repoRoot = TryResolveRepositoryRoot();

        if (repoRoot is not null)
        {
            string fixturePath = Path.Combine(repoRoot, "fixtures", "roi", ManifestFileName);

            if (File.Exists(fixturePath))
                return fixturePath;
        }

        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "fixtures", "roi", ManifestFileName);

        if (File.Exists(bundled))
            return bundled;

        throw new FileNotFoundException(
            $"ROI scope manifest not found (expected fixtures/roi/{ManifestFileName}).",
            bundled);
    }

    private static string? TryResolveRepositoryRoot()
    {
        string? current = Directory.GetCurrentDirectory();

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            if (File.Exists(Path.Combine(current, "ArchLucid.sln"))
                || File.Exists(Path.Combine(current, "Directory.Build.props")))
            {
                return current;
            }

            current = Directory.GetParent(current)?.FullName;
        }

        return null;
    }
}

public sealed class RoiSponsorFacingScopeManifestDocument
{
    public int SchemaVersion { get; init; }

    public RoiSponsorFacingScopeManifestCodes Codes { get; init; } = new();

    public RoiSponsorFacingScopeManifestDescriptions Descriptions { get; init; } = new();

    public string NonAdditivityCaveat { get; init; } = string.Empty;
}

public sealed class RoiSponsorFacingScopeManifestCodes
{
    public string HeadlineDispositionAware { get; init; } = string.Empty;

    public string SystemRowSnapshotPotential { get; init; } = string.Empty;

    public string CrossTenantPortfolioHeadline { get; init; } = string.Empty;

    public string ValueReportActivityWindow { get; init; } = string.Empty;

    public string Trailing30DayFindingEvents { get; init; } = string.Empty;

    public string PilotScorecardUtcWindow { get; init; } = string.Empty;
}

public sealed class RoiSponsorFacingScopeManifestDescriptions
{
    public string HeadlineDispositionAware { get; init; } = string.Empty;

    public string SystemRowSnapshotPotential { get; init; } = string.Empty;

    public string CrossTenantPortfolioHeadline { get; init; } = string.Empty;

    public string Trailing30DayFindingEvents { get; init; } = string.Empty;

    public string ValueReportActivityWindowGeneric { get; init; } = string.Empty;

    public string PilotScorecardUtcWindowGeneric { get; init; } = string.Empty;
}
