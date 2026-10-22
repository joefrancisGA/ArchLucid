using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Runs;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <summary>
///     Loaded inputs and mutable report state shared across replay comparison diff slices.
/// </summary>
public sealed class ReplayComparisonBuildContext
{
    public required string LeftRunId { get; init; }

    public required string RightRunId { get; init; }

    public required ArchitectureRunDetail LeftDetail { get; init; }

    public required ArchitectureRunDetail RightDetail { get; init; }

    public ReviewRunEngineProvenance? LeftEngineProvenance { get; init; }

    public ReviewRunEngineProvenance? RightEngineProvenance { get; init; }

    public required IReadOnlyList<RunExportRecord> LeftExports { get; init; }

    public required IReadOnlyList<RunExportRecord> RightExports { get; init; }

    public required EndToEndReplayComparisonReport Report { get; init; }
}
