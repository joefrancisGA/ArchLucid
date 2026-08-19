using System.Text.Json;

using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Agents;

public static class ModelExecutionProfileOverrideAuditWriter
{
    /// <summary>Best-effort audit when a run-create profile override is applied (INV-003 informational).</summary>
    [InformationalAudit]
    public static async Task TryLogOverrideAppliedAsync(
        IAuditService auditService,
        IScopeContextProvider scopeContextProvider,
        string runId,
        ModelExecutionProfileResolution profileResolution,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(profileResolution);

        if (string.IsNullOrWhiteSpace(profileResolution.RequestedOverrideRaw))
        {
            return;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid parsedRunId) ? parsedRunId : null;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunModelExecutionProfileOverrideApplied,
                ActorUserId = "run-create",
                ActorUserName = "run-create",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runGuid,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        requestedOverride = profileResolution.RequestedOverrideRaw,
                        effectiveProfile = AgentModelExecutionProfileParser.Format(profileResolution.EffectiveProfile),
                        workspaceDefault = AgentModelExecutionProfileParser.Format(profileResolution.WorkspaceDefault),
                        overrideRejected = profileResolution.OverrideRejected
                    })
            },
            cancellationToken).ConfigureAwait(false);
    }
}
