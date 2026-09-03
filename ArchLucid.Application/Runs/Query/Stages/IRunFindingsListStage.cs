namespace ArchLucid.Application.Runs.Query.Stages;

public interface IRunFindingsListStage
{
    Task<RunFindingsListQueryResult> ListRunFindingsAsync(
        string runId,
        string? orderBy,
        int? take,
        int? cursorSortOrder,
        int? cursorPriorityRank,
        Guid? cursorFindingRecordId,
        CancellationToken cancellationToken);
}
