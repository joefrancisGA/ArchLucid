namespace ArchLucid.Application.Runs.Query.Stages;

public interface IRunFindingsInspectStage
{
    Task<FindingInspectQueryResult> GetFindingInspectForRunAsync(
        string runId,
        string findingId,
        bool includeTypedPayload,
        CancellationToken cancellationToken);
}
