using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy.Trial;

/// <inheritdoc cref="ITenantTrialIdentityHandoffStage" />
public sealed class TenantTrialIdentityHandoffStage(
    ITenantRepository tenantRepository,
    ITrialIdentityUserRepository trialIdentityUsers,
    IAuditService auditService) : ITenantTrialIdentityHandoffStage
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITrialIdentityUserRepository _trialIdentityUsers =
        trialIdentityUsers ?? throw new ArgumentNullException(nameof(trialIdentityUsers));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<TenantTrialLinkEntraResult> LinkEntraAsync(
        TenantTrialLinkEntraBody body,
        TenantRecord tenant,
        ScopeContext scope,
        string actor,
        string? normalizedLocalEmail,
        bool hasIdentityPayload,
        CancellationToken cancellationToken)
    {
        bool directoryAlreadyBound = tenant.EntraTenantId == body.EntraTenantId;

        bool bound = await _tenantRepository
            .UpdateEntraTenantIdAsync(scope.TenantId, body.EntraTenantId, cancellationToken)
            .ConfigureAwait(false);

        if (!bound)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.Conflict,
                Message =
                    "Entra directory could not be bound (already bound to a different directory, or directory id is held by another tenant).",
            };
        }

        if (!directoryAlreadyBound)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TenantEntraDirectoryBound,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = tenant.Id,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new { entraTenantId = body.EntraTenantId }),
                },
                cancellationToken).ConfigureAwait(false);
        }

        if (!hasIdentityPayload || normalizedLocalEmail is null)
            return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.Success };

        TrialIdentityUserRecord? existingIdentity = await _trialIdentityUsers
            .GetByNormalizedEmailAsync(normalizedLocalEmail, cancellationToken)
            .ConfigureAwait(false);

        bool identityAlreadyLinked = existingIdentity?.LinkedEntraOid is not null
            && string.Equals(existingIdentity.LinkedEntraOid, body.EntraOid!.Trim(), StringComparison.OrdinalIgnoreCase);

        bool identityLinked = await _trialIdentityUsers.TryLinkLocalIdentityToEntraAsync(
            normalizedLocalEmail,
            body.EntraOid!.Trim(),
            cancellationToken).ConfigureAwait(false);

        if (!identityLinked)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.Conflict,
                Message =
                    "Entra directory was bound, but updating the local identity row failed (retry or contact support).",
            };
        }

        if (!identityAlreadyLinked)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TrialLocalIdentityLinkedToEntra,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = tenant.Id,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new { normalizedEmail = normalizedLocalEmail }),
                },
                cancellationToken).ConfigureAwait(false);
        }

        return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.Success };
    }
}
