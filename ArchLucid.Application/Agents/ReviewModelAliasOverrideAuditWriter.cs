using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Agents;

public static class ReviewModelAliasOverrideAuditWriter
{
    public static async Task TryLogOverrideAppliedAsync(
        IAuditService auditService,
        IScopeContextProvider scopeContextProvider,
        string runId,
        ReviewModelAliasResolution resolution,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(resolution);

        if (string.IsNullOrWhiteSpace(resolution.RequestedOverrideRaw))
        {
            return;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        Guid? runIdGuid = Guid.TryParse(runId, out Guid parsedRunId) ? parsedRunId : null;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunModelAliasOverrideApplied,
                ActorUserId = "system",
                ActorUserName = "system",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runIdGuid,
                DataJson = System.Text.Json.JsonSerializer.Serialize(
                    new
                    {
                        requestedAlias = resolution.RequestedOverrideRaw,
                        effectiveAlias = resolution.EffectiveAliasId,
                        workspaceDefaultAlias = resolution.WorkspaceDefaultAliasId,
                        rejectedOutsideAllowedSet = resolution.RejectedOutsideAllowedSet,
                        rejectedMissingSubprocessorAcknowledgment =
                            resolution.RejectedMissingSubprocessorAcknowledgment
                    })
            },
            cancellationToken).ConfigureAwait(false);
    }
}
