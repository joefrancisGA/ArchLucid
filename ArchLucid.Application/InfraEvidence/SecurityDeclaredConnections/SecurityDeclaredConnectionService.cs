using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;

public sealed class SecurityDeclaredConnectionService(
    ISecurityDeclaredConnectionRepository connectionRepository,
    IAuditService auditService,
    ILogger<SecurityDeclaredConnectionService> logger) : ISecurityDeclaredConnectionService
{
    public async Task<SecurityDeclaredConnectionCreateResult> CreateAsync(
        ScopeContext scope,
        SecurityDeclaredConnectionCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        if (!SecurityDeclaredConnectionGuard.TryValidateCreateRequest(request, utcNow, out string? validationError))
        {
            return new SecurityDeclaredConnectionCreateResult
            {
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        SecurityDeclaredConnectionRecord? existingActive =
            await connectionRepository.TryGetActiveDuplicateAsync(
                scope.TenantId,
                request.FromCloudResourceId,
                request.ToCloudResourceId,
                request.RelationshipType,
                utcNow,
                cancellationToken);

        if (existingActive is not null
            && SecureNowScopeGuard.Matches(
                scope,
                existingActive.TenantId,
                existingActive.WorkspaceId,
                existingActive.ProjectId))
        {
            return new SecurityDeclaredConnectionCreateResult
            {
                Succeeded = false,
                ErrorMessage = "An active declared connection already exists for this source, target, and relationship type.",
            };
        }

        Guid connectionId = Guid.NewGuid();
        byte[] payloadHash = SecurityDeclaredConnectionGuard.ComputePayloadHash(request);

        SecurityDeclaredConnectionRecord record = new()
        {
            ConnectionId = connectionId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FromCloudResourceId = request.FromCloudResourceId,
            ToCloudResourceId = request.ToCloudResourceId,
            RelationshipType = request.RelationshipType,
            Rationale = request.Rationale.Trim(),
            EvidenceReference = request.EvidenceReference?.Trim(),
            ExpirationUtc = request.ExpirationUtc,
            Status = SecurityDeclaredConnectionStatus.Active,
            RequestedByActorKey = request.RequestedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await connectionRepository.InsertAsync(record, cancellationToken);

        await LogAuditAsync(
            scope,
            request.ApprovedByActorKey.Trim(),
            AuditEventTypes.SecurityDeclaredConnectionCreated,
            connectionId,
            request,
            cancellationToken);

        return new SecurityDeclaredConnectionCreateResult
        {
            Succeeded = true,
            ConnectionId = connectionId,
        };
    }

    public async Task<SecurityDeclaredConnectionRenewResult> RenewAsync(
        ScopeContext scope,
        Guid connectionId,
        SecurityDeclaredConnectionRenewRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (connectionId == Guid.Empty)
        {
            return new SecurityDeclaredConnectionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "ConnectionId is required.",
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        if (!SecurityDeclaredConnectionGuard.TryValidateRenewRequest(request, utcNow, out string? validationError))
        {
            return new SecurityDeclaredConnectionRenewResult
            {
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        SecurityDeclaredConnectionRecord? existing =
            await connectionRepository.TryGetByIdInScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                connectionId,
                cancellationToken);

        if (existing is null)
        {
            return new SecurityDeclaredConnectionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "Declared connection was not found.",
            };
        }

        if (existing.Status != SecurityDeclaredConnectionStatus.Active)
        {
            return new SecurityDeclaredConnectionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "Only active declared connections can be renewed.",
            };
        }

        SecurityDeclaredConnectionRecord renewed = new()
        {
            ConnectionId = existing.ConnectionId,
            TenantId = existing.TenantId,
            WorkspaceId = existing.WorkspaceId,
            ProjectId = existing.ProjectId,
            FromCloudResourceId = existing.FromCloudResourceId,
            ToCloudResourceId = existing.ToCloudResourceId,
            RelationshipType = existing.RelationshipType,
            Rationale = existing.Rationale,
            EvidenceReference = existing.EvidenceReference,
            ExpirationUtc = request.ExpirationUtc,
            Status = SecurityDeclaredConnectionStatus.Active,
            RequestedByActorKey = existing.RequestedByActorKey,
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            PayloadHashSha256 = SecurityDeclaredConnectionGuard.ComputeRenewalPayloadHash(
                existing,
                request.ExpirationUtc,
                request.RenewedByActorKey,
                request.ApprovedByActorKey),
            ExpiryProcessedUtc = null,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = utcNow,
            RevokedUtc = null,
            RevokedByActorKey = null,
        };

        await connectionRepository.UpdateRenewalAsync(renewed, cancellationToken);

        await LogAuditAsync(
            scope,
            request.ApprovedByActorKey.Trim(),
            AuditEventTypes.SecurityDeclaredConnectionRenewed,
            connectionId,
            request,
            cancellationToken);

        return new SecurityDeclaredConnectionRenewResult
        {
            Succeeded = true,
        };
    }

    public async Task<SecurityDeclaredConnectionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid connectionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (connectionId == Guid.Empty)
        {
            return new SecurityDeclaredConnectionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "ConnectionId is required.",
            };
        }

        if (string.IsNullOrWhiteSpace(revokedByActorKey))
        {
            return new SecurityDeclaredConnectionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "RevokedByActorKey is required.",
            };
        }

        SecurityDeclaredConnectionRecord? existing =
            await connectionRepository.TryGetByIdInScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                connectionId,
                cancellationToken);

        if (existing is null)
        {
            return new SecurityDeclaredConnectionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Declared connection was not found.",
            };
        }

        if (existing.Status != SecurityDeclaredConnectionStatus.Active)
        {
            return new SecurityDeclaredConnectionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Only active declared connections can be revoked.",
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        await connectionRepository.RevokeAsync(
            scope.TenantId,
            connectionId,
            revokedByActorKey.Trim(),
            utcNow,
            cancellationToken);

        await LogAuditAsync(
            scope,
            revokedByActorKey.Trim(),
            AuditEventTypes.SecurityDeclaredConnectionRevoked,
            connectionId,
            new { ConnectionId = connectionId },
            cancellationToken);

        return new SecurityDeclaredConnectionRevokeResult
        {
            Succeeded = true,
        };
    }

    public async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecurityDeclaredConnectionRecord> records =
            await connectionRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        List<SecurityDeclaredConnectionRecord> results = [];

        foreach (SecurityDeclaredConnectionRecord record in records)
        {
            if (record.Status == SecurityDeclaredConnectionStatus.Active && record.ExpirationUtc <= utcNow)
            {
                results.Add(new SecurityDeclaredConnectionRecord
                {
                    ConnectionId = record.ConnectionId,
                    TenantId = record.TenantId,
                    WorkspaceId = record.WorkspaceId,
                    ProjectId = record.ProjectId,
                    FromCloudResourceId = record.FromCloudResourceId,
                    ToCloudResourceId = record.ToCloudResourceId,
                    RelationshipType = record.RelationshipType,
                    Rationale = record.Rationale,
                    EvidenceReference = record.EvidenceReference,
                    ExpirationUtc = record.ExpirationUtc,
                    Status = SecurityDeclaredConnectionStatus.Expired,
                    RequestedByActorKey = record.RequestedByActorKey,
                    ApprovedByActorKey = record.ApprovedByActorKey,
                    PayloadHashSha256 = record.PayloadHashSha256,
                    ExpiryProcessedUtc = record.ExpiryProcessedUtc,
                    CreatedUtc = record.CreatedUtc,
                    UpdatedUtc = record.UpdatedUtc,
                    RevokedUtc = record.RevokedUtc,
                    RevokedByActorKey = record.RevokedByActorKey,
                });

                continue;
            }

            results.Add(record);
        }

        return results;
    }

    public async Task<SecurityDeclaredConnectionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecurityDeclaredConnectionRecord> expired =
            await connectionRepository.MarkExpiredAsync(scope.TenantId, utcNow, cancellationToken);

        foreach (SecurityDeclaredConnectionRecord record in expired)
        {
            if (record.ExpiryProcessedUtc is not null)
            {
                continue;
            }

            await connectionRepository.MarkExpiryProcessedAsync(
                scope.TenantId,
                record.ConnectionId,
                utcNow,
                cancellationToken);

            await LogAuditAsync(
                scope,
                SecureNowArchitectConstants.SystemActorId,
                AuditEventTypes.SecurityDeclaredConnectionExpired,
                record.ConnectionId,
                new { ConnectionId = record.ConnectionId },
                cancellationToken);
        }

        logger.LogInformation(
            "Declared connection expiry sweep processed {ExpiredCount} rows for TenantId={TenantId}.",
            expired.Count,
            scope.TenantId);

        return new SecurityDeclaredConnectionExpirySweepResult
        {
            ExpiredCount = expired.Count,
        };
    }

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorId,
        string eventType,
        Guid connectionId,
        object payload,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { connectionId, payload },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }
}
