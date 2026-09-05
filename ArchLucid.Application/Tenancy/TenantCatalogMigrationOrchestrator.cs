using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed partial class TenantCatalogMigrationOrchestrator(
    ITenantCatalogMigrationRepository migrationRepository,
    ITenantRepository tenantRepository,
    ITenantSuspendCommandService tenantSuspendCommandService,
    ITenantMigrationProjectionRefreshService projectionRefreshService,
    ITenantMigrationVerificationProbe verificationProbe,
    IPlatformAuditRepository platformAuditRepository,
    TimeProvider timeProvider) : ITenantCatalogMigrationOrchestrator
{
    private const string DefaultMaintenanceMessage = TenantMigrationMaintenanceMessages.DefaultSuspendMessage;

    private readonly ITenantCatalogMigrationRepository _migrationRepository =
        migrationRepository ?? throw new ArgumentNullException(nameof(migrationRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantSuspendCommandService _tenantSuspendCommandService =
        tenantSuspendCommandService ?? throw new ArgumentNullException(nameof(tenantSuspendCommandService));

    private readonly ITenantMigrationProjectionRefreshService _projectionRefreshService =
        projectionRefreshService ?? throw new ArgumentNullException(nameof(projectionRefreshService));

    private readonly ITenantMigrationVerificationProbe _verificationProbe =
        verificationProbe ?? throw new ArgumentNullException(nameof(verificationProbe));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private Task AppendPlatformAuditAsync(
        string eventType,
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        object payload,
        CancellationToken cancellationToken)
    {
        PlatformAuditEvent auditEvent = new()
        {
            EventType = eventType,
            SubjectTenantId = tenantId,
            ActorUserId = actorUserId,
            ActorUserName = actorUserName,
            CorrelationId = correlationId,
            DataJson = JsonSerializer.Serialize(payload),
        };

        return _platformAuditRepository.AppendAsync(auditEvent, cancellationToken);
    }
}
