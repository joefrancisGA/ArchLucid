using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;

namespace ArchLucid.Application.Analysis;

/// <summary>Outcome of loading a scoped architecture run pair for comparison.</summary>
public enum ScopedRunPairLoadOutcome
{
    Success,
    LeftRunNotFound,
    RightRunNotFound,
}

/// <summary>Loaded scoped run pair for agent-result comparison.</summary>
public sealed record ScopedRunPairLoadResult
{
    public required ScopedRunPairLoadOutcome Outcome { get; init; }

    public ArchitectureRunDetail? Left { get; init; }

    public ArchitectureRunDetail? Right { get; init; }

    public string? MissingRunId { get; init; }
}

/// <summary>Outcome of loading runs and golden manifests for manifest comparison.</summary>
public enum ManifestCompareLoadOutcome
{
    Success,
    BaseRunNotFound,
    TargetRunNotFound,
    BaseManifestNotFound,
    TargetManifestNotFound,
}

/// <summary>Manifest comparison result or a not-found reason.</summary>
public sealed record ManifestCompareLoadResult
{
    public required ManifestCompareLoadOutcome Outcome { get; init; }

    public ComparisonResult? Comparison { get; init; }

    public Guid? RunId { get; init; }
}
