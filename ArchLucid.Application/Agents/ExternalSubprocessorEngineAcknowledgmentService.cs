using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Agents;

/// <summary>Records and checks workspace-admin acknowledgment before external-subprocessor engines (TB-2109).</summary>
public sealed class ExternalSubprocessorEngineAcknowledgmentService(
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ITenantSettingsRepository tenantSettingsRepository) : IExternalSubprocessorEngineAcknowledgmentService
{
    private const string AcknowledgedValue = "Acknowledged";

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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

        return string.Equals(stored, AcknowledgedValue, StringComparison.Ordinal);
    }

    public async Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.ExternalSubprocessorEngineAcknowledged,
                AcknowledgedValue,
                cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WorkspaceExternalSubprocessorEngineAcknowledged,
                ActorUserId = actorUserId,
                ActorUserName = actorUserId,
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
