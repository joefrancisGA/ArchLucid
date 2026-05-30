namespace ArchLucid.Cli.Support;

/// <summary>
///     Seeded support-bundle triage drill describing a common first-pilot failure mode.
/// </summary>
public sealed class SupportBundleTriageDrillScenario
{
    public required string DrillId { get; init; }

    public required string Title { get; init; }

    public required string LikelyCause { get; init; }

    public required string EvidencePath { get; init; }

    public required IReadOnlyList<string> CorrelationFields { get; init; }

    public required string NextCommand { get; init; }
}
