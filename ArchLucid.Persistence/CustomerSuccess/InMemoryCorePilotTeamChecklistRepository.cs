using ArchLucid.Core.CustomerSuccess;

namespace ArchLucid.Persistence.CustomerSuccess;

public sealed class InMemoryCorePilotTeamChecklistRepository : ICorePilotTeamChecklistRepository
{
    private readonly object _gate = new();

    private readonly Dictionary<(Guid T, Guid W, Guid P, int S), CorePilotChecklistStepRow> _rows = new();

    public Task<IReadOnlyList<CorePilotChecklistStepRow>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            List<CorePilotChecklistStepRow> copy = _rows
                .Where(kv => kv.Key.T == tenantId && kv.Key.W == workspaceId && kv.Key.P == projectId)
                .OrderBy(static kv => kv.Key.S)
                .Select(static kv => kv.Value)
                .ToList();

            return Task.FromResult<IReadOnlyList<CorePilotChecklistStepRow>>(copy);
        }
    }

    public Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int stepIndex,
        bool isCompleted,
        string? updatedByUserId,
        CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            DateTimeOffset now = DateTimeOffset.UtcNow;
            _rows[(tenantId, workspaceId, projectId, stepIndex)] = new CorePilotChecklistStepRow(
                stepIndex,
                isCompleted,
                now,
                updatedByUserId);
        }

        return Task.CompletedTask;
    }
}
