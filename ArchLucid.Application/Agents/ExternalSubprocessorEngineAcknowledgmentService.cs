using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Agents;

/// <summary>Records and checks workspace-admin acknowledgment before external-subprocessor engines (TB-2109).</summary>
public sealed class ExternalSubprocessorEngineAcknowledgmentService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    ITenantSettingsRepository tenantSettingsRepository) : IExternalSubprocessorEngineAcknowledgmentService
{
    private const string AcknowledgedValue = "Acknowledged";

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public async Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.ExternalSubprocessorEngineAcknowledged, cancellationToken)
            .ConfigureAwait(false);

        return string.Equals(stored?.Trim(), AcknowledgedValue, StringComparison.Ordinal);
    }

    public async Task RecordWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.ExternalSubprocessorEngineAcknowledged,
                AcknowledgedValue,
                cancellationToken)
            .ConfigureAwait(false);

        string actorUserId = _actorContext.GetActorId();
        string actorUserName = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceExternalSubprocessorEngineAcknowledged,
                ExplicitActor = true,
                ActorUserId = actorUserId,
                ActorUserName = actorUserName,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = """{"scope":"workspace","kind":"regulated-evidence-external-subprocessor"}"""
            },
            cancellationToken).ConfigureAwait(false);
    }

    private Guid RequireTenantId()
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
        {
            throw new InvalidOperationException("Tenant scope is required.");
        }

        return tenantId;
    }
}
