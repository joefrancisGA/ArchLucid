using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Runs.Query;

/// <summary>
///     Application read surface for run findings list, export, inspect, and evidence-chain queries.
/// </summary>
public interface IRunFindingsQueryService
{
    Task<RunFindingsListQueryResult> ListRunFindingsAsync(
        string runId,
        string? orderBy,
        int? take,
        int? cursorSortOrder,
        int? cursorPriorityRank,
        Guid? cursorFindingRecordId,
        CancellationToken cancellationToken);

    Task<RunFindingsCsvExportQueryResult> ExportRunFindingsCsvAsync(string runId, CancellationToken cancellationToken);

    Task<FindingEvidenceChainQueryResult> GetFindingEvidenceChainAsync(
        string runId,
        string findingId,
        CancellationToken cancellationToken);

    Task<FindingInspectQueryResult> GetFindingInspectForRunAsync(
        string runId,
        string findingId,
        bool includeTypedPayload,
        CancellationToken cancellationToken);
}

public enum RunFindingsQueryOutcome
{
    Success,
    BadRequest,
    NotFound,
    ManifestNotFound
}

public sealed class RunFindingsListQueryResult
{
    public RunFindingsQueryOutcome Outcome { get; init; }
    public RunFindingsListResponse? Response { get; init; }
    public string? Etag { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunFindingsCsvExportQueryResult
{
    public RunFindingsQueryOutcome Outcome { get; init; }
    public byte[]? CsvBytes { get; init; }
    public string? DownloadName { get; init; }
    public int FindingCount { get; init; }
    public Guid? AuditRunId { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class FindingEvidenceChainQueryResult
{
    public RunFindingsQueryOutcome Outcome { get; init; }
    public FindingEvidenceChainResponse? Chain { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class FindingInspectQueryResult
{
    public RunFindingsQueryOutcome Outcome { get; init; }
    public FindingInspectResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}
