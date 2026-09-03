using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-18 suggestion 180: scope assertions with operation-specific conflict messages.
/// </summary>
public static class RunScopeAssertionGuard
{
    public static void EnsureCallerScopeMatchesRunOrThrow(
        ScopeContext callerScope,
        RunRecord runHeader,
        string runIdLabel,
        string operationLabel)
    {
        ArgumentNullException.ThrowIfNull(callerScope);
        ArgumentNullException.ThrowIfNull(runHeader);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationLabel);

        if (runHeader.TenantId != callerScope.TenantId
            || runHeader.WorkspaceId != callerScope.WorkspaceId
            || runHeader.ScopeProjectId != callerScope.ProjectId)
        {
            throw new ConflictException(
                $"{operationLabel} blocked for run '{runIdLabel}': caller scope does not match the run header.");
        }
    }
}
