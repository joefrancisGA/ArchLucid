using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-13 suggestion 127: replay paths must stay within the source run tenant/workspace/project scope.
/// </summary>
public static class ReplayRunScopeAssertionGuard
{
    public static void EnsureCallerScopeMatchesSourceOrThrow(
        ScopeContext callerScope,
        RunRecord sourceHeader,
        string originalRunIdLabel)
    {
        ArgumentNullException.ThrowIfNull(callerScope);
        ArgumentNullException.ThrowIfNull(sourceHeader);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunIdLabel);

        if (sourceHeader.TenantId != callerScope.TenantId
            || sourceHeader.WorkspaceId != callerScope.WorkspaceId
            || sourceHeader.ScopeProjectId != callerScope.ProjectId)
        {
            throw new ConflictException(
                $"Replay blocked for run '{originalRunIdLabel}': caller scope does not match the source run header.");
        }
    }

    public static void EnsureReplayHeaderMatchesSourceScopeOrThrow(
        RunRecord replayHeader,
        RunRecord sourceHeader,
        string originalRunIdLabel)
    {
        ArgumentNullException.ThrowIfNull(replayHeader);
        ArgumentNullException.ThrowIfNull(sourceHeader);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunIdLabel);

        if (replayHeader.TenantId != sourceHeader.TenantId
            || replayHeader.WorkspaceId != sourceHeader.WorkspaceId
            || replayHeader.ScopeProjectId != sourceHeader.ScopeProjectId)
        {
            throw new ConflictException(
                $"Replay blocked for run '{originalRunIdLabel}': replay header scope does not match the source run.");
        }
    }
}
