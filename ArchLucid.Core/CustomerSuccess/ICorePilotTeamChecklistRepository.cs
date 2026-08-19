namespace ArchLucid.Core.CustomerSuccess;

public sealed record CorePilotChecklistStepRow(
    int StepIndex,
    bool IsCompleted,
    DateTimeOffset UpdatedUtc,
    string? UpdatedByUserId);

public interface ICorePilotTeamChecklistRepository
{
    Task<IReadOnlyList<CorePilotChecklistStepRow>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken);

    Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int stepIndex,
        bool isCompleted,
        string? updatedByUserId,
        CancellationToken cancellationToken);
}
