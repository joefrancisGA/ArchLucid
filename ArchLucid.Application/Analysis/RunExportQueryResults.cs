using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public enum ExportRecordLoadOutcome
{
    Success,
    RunNotFound,
    LineageUnverified,
    ExportRecordNotFound,
    LeftIdRequired,
    RightIdRequired,
    LeftNotFound,
    RightNotFound,
}

public sealed record ScopedExportRecordLoadResult
{
    public required ExportRecordLoadOutcome Outcome { get; init; }
    public RunExportRecord? Record { get; init; }
    public string? MissingId { get; init; }
}

public sealed record RunExportHistoryQueryResult
{
    public required ExportRecordLoadOutcome Outcome { get; init; }
    public IReadOnlyList<RunExportRecord>? Exports { get; init; }
    public string? MissingRunId { get; init; }
}

public sealed record ExportRecordDiffQueryResult
{
    public required ExportRecordLoadOutcome Outcome { get; init; }
    public ExportRecordDiffResult? Diff { get; init; }
    public string? MissingId { get; init; }
}

public sealed record ExportRecordDiffSummaryQueryResult
{
    public required ExportRecordLoadOutcome Outcome { get; init; }
    public string? SummaryMarkdown { get; init; }
    public string? ComparisonRecordId { get; init; }
    public string? MissingId { get; init; }
}

public sealed record ExportReplayQueryResult
{
    public required ExportRecordLoadOutcome Outcome { get; init; }
    public ReplayExportResult? Replay { get; init; }
    public string? MissingId { get; init; }
}
