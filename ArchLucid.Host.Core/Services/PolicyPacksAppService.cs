using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Services;

/// <summary>
/// Default <see cref="IPolicyPacksAppService"/>: mutates packs through <see cref="IPolicyPackManagementService"/> and writes audit trails.
/// </summary>
/// <remarks>
/// Registered scoped in <c>ServiceCollectionExtensions</c>. Uses <see cref="IPolicyPackVersionRepository"/> for assign preflight
/// (version existence) before delegating persistence to the management service.
/// </remarks>
/// <param name="managementService">Domain mutations (create / publish / assign row).</param>
/// <param name="packRepository">Loads pack metadata to block republishing platform defaults.</param>
/// <param name="versionRepository">Read path for assign 404 semantics.</param>
/// <param name="auditService">Structured audit log.</param>
/// <param name="integrationEventOutbox">Transactional outbox for integration events.</param>
/// <param name="integrationEventPublisher">Direct Service Bus publisher when outbox is disabled.</param>
/// <param name="integrationEventsOptions">Integration event transport options.</param>
/// <param name="logger">Structured logging.</param>
public sealed class PolicyPacksAppService(
    IPolicyPackManagementService managementService,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPolicyPackAssignmentRepository assignmentRepository,
    IAuditService auditService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<PolicyPacksAppService> logger) : IPolicyPacksAppService
{
    /// <inheritdoc />
    /// <remarks>Audit payload: pack id, name, pack type (minimal PII).</remarks>
    public async Task<PolicyPack> CreatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct)
    {
        string normalizedContent = string.IsNullOrWhiteSpace(initialContentJson) ? "{}" : initialContentJson;

        IReadOnlyList<PolicyPack> packsInScope = await packRepository
            .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
            .ConfigureAwait(false);

        PolicyPack? existingPack = packsInScope.FirstOrDefault(
            pack =>
                !pack.IsDeleted
                && string.Equals(pack.Name, name, StringComparison.OrdinalIgnoreCase)
                && string.Equals(pack.Description, description, StringComparison.OrdinalIgnoreCase)
                && string.Equals(pack.PackType, packType, StringComparison.OrdinalIgnoreCase));

        if (existingPack is not null)
        {
            PolicyPackVersion? existingVersion = await versionRepository
                .GetByPackAndVersionAsync(existingPack.PolicyPackId, existingPack.CurrentVersion, ct)
                .ConfigureAwait(false);

            if (existingVersion is not null
                && string.Equals(existingVersion.ContentJson, normalizedContent, StringComparison.Ordinal))
            {
                return existingPack;
            }
        }

        PolicyPack pack = await managementService
                .CreatePackAsync(tenantId, workspaceId, projectId, name, description, packType, initialContentJson, ct)
            ;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackCreated, DataJson = JsonSerializer.Serialize(new { pack.PolicyPackId, pack.Name, pack.PackType }),
            },
            ct);

        return pack;
    }

    /// <inheritdoc />
    /// <remarks>Audit payload: policy pack id and published version label.</remarks>
    public async Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct)
    {
        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (pack is not null
            && string.Equals(pack.PackType, PolicyPackType.PlatformDefault, StringComparison.Ordinal))
            throw new InvalidOperationException("Platform-default policy packs cannot be republished via API.");

        string normalizedJson = string.IsNullOrWhiteSpace(contentJson) ? "{}" : contentJson;

        PolicyPackVersion? existingVersion = await ResolvePackVersionAsync(policyPackId, version, ct)
            .ConfigureAwait(false);

        bool isIdenticalRetry = existingVersion is not null
            && existingVersion.IsPublished
            && string.Equals(existingVersion.ContentJson, normalizedJson, StringComparison.Ordinal);

        PolicyPackVersion packVersion = await managementService
                .PublishVersionAsync(policyPackId, version, contentJson, ct)
            ;

        if (!isIdenticalRetry)
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PolicyPackVersionPublished, DataJson = JsonSerializer.Serialize(new { policyPackId, packVersion.Version }),
                },
                ct);

            if (pack is not null)
            {
                await PolicyPackIntegrationEventPublishing.TryPublishPublishedAsync(
                    integrationEventOutbox,
                    integrationEventPublisher,
                    integrationEventsOptions,
                    logger,
                    pack,
                    packVersion,
                    ct);
            }
        }

        return packVersion;
    }

    /// <inheritdoc />
    /// <remarks>
    /// Early return <c>null</c> avoids creating orphan assignment rows when the client references a non-existent version.
    /// Audit includes assignment id, scope level, and pin flag for SIEM correlation.
    /// </remarks>
    public async Task<PolicyPackAssignment?> TryAssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        bool isOrganizationRequired,
        CancellationToken ct)
    {
        PolicyPackVersion? packVersion = await ResolvePackVersionAsync(policyPackId, version, ct);
        if (packVersion is null)
            return null;

        (Guid scopeWorkspaceId, Guid scopeProjectId) =
            NormalizeAssignScope(workspaceId, projectId, scopeLevel);

        HashSet<Guid> existingAssignmentIds = (await assignmentRepository
                .ListByScopeAsync(tenantId, scopeWorkspaceId, scopeProjectId, ct)
                .ConfigureAwait(false))
            .Select(assignment => assignment.AssignmentId)
            .ToHashSet();

        PolicyPackAssignment assignment = await managementService
                .AssignAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    policyPackId,
                    version,
                    scopeLevel,
                    isPinned,
                    isOrganizationRequired,
                    isEnabled: true,
                    ct)
            ;

        if (!existingAssignmentIds.Contains(assignment.AssignmentId))
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PolicyPackAssignmentCreated,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            assignment.AssignmentId,
                            policyPackId,
                            version = assignment.PolicyPackVersion,
                            assignment.ScopeLevel,
                            assignment.IsPinned,
                            assignment.IsOrganizationRequired,
                        }),
                },
                ct);
        }

        return assignment;
    }

    /// <inheritdoc />
    public async Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct)
    {
        PolicyPackAssignment? existing =
            await assignmentRepository.GetByTenantAndAssignmentIdAsync(tenantId, assignmentId, ct);

        bool wasAlreadyArchived = existing?.ArchivedUtc.HasValue == true;

        bool ok = await managementService.TryArchiveAssignmentAsync(tenantId, assignmentId, ct);

        if (!ok)
            return false;

        if (!wasAlreadyArchived)
        {
            await auditService.LogAsync(
                new AuditEvent { EventType = AuditEventTypes.PolicyPackAssignmentArchived, DataJson = JsonSerializer.Serialize(new { assignmentId }), },
                ct);
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> TrySoftDeletePackAsync(Guid tenantId, Guid policyPackId, CancellationToken ct)
    {
        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (pack is null || pack.TenantId != tenantId)
            return false;

        if (pack.IsDeleted)
            return true;

        pack.IsDeleted = true;
        pack.Status = PolicyPackStatus.Retired;

        await packRepository.UpdateAsync(pack, ct);

        await auditService.LogAsync(
            new AuditEvent { EventType = "PolicyPackDeleted", DataJson = JsonSerializer.Serialize(new { policyPackId }), },
            ct);

        return true;
    }

    private static (Guid WorkspaceId, Guid ProjectId) NormalizeAssignScope(
        Guid workspaceId,
        Guid projectId,
        string scopeLevel)
    {
        string normalized = GovernanceScopeLevel.TryNormalize(scopeLevel) ?? GovernanceScopeLevel.Project;

        if (string.Equals(normalized, GovernanceScopeLevel.Tenant, StringComparison.Ordinal))
            return (Guid.Empty, Guid.Empty);

        if (string.Equals(normalized, GovernanceScopeLevel.Workspace, StringComparison.Ordinal))
            return (workspaceId, Guid.Empty);

        return (workspaceId, projectId);
    }

    /// <inheritdoc />
    public async Task<PolicyPack?> TryDuplicatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        CancellationToken ct)
    {
        PolicyPack? sourcePack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (sourcePack is null || sourcePack.TenantId != tenantId || sourcePack.IsDeleted)
            return null;

        IReadOnlyList<PolicyPackVersion> versions = await versionRepository.ListByPackAsync(policyPackId, ct);
        PolicyPackVersion? latestMeta = versions.FirstOrDefault();

        if (latestMeta is null)
            return null;

        // List omits ContentJson; load the full body for the latest version label.
        PolicyPackVersion? latestVersion =
            await versionRepository.GetByPackAndVersionAsync(policyPackId, latestMeta.Version, ct);

        if (latestVersion is null || string.IsNullOrWhiteSpace(latestVersion.ContentJson))
            return null;

        string copyName = sourcePack.Name.TrimEnd() + " (Copy)";

        IReadOnlyList<PolicyPack> packsInScope = await packRepository
            .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
            .ConfigureAwait(false);

        PolicyPack? existingDuplicate = packsInScope.FirstOrDefault(
            pack =>
                !pack.IsDeleted
                && string.Equals(pack.Name, copyName, StringComparison.OrdinalIgnoreCase)
                && string.Equals(pack.Description, sourcePack.Description, StringComparison.OrdinalIgnoreCase)
                && string.Equals(pack.PackType, sourcePack.PackType, StringComparison.Ordinal));

        if (existingDuplicate is not null)
        {
            PolicyPackVersion? existingVersion = await versionRepository
                .GetByPackAndVersionAsync(existingDuplicate.PolicyPackId, existingDuplicate.CurrentVersion, ct)
                .ConfigureAwait(false);

            if (existingVersion is not null
                && string.Equals(existingVersion.ContentJson, latestVersion.ContentJson, StringComparison.Ordinal))
            {
                return existingDuplicate;
            }
        }

        PolicyPack duplicate = await managementService.CreatePackAsync(
            tenantId,
            workspaceId,
            projectId,
            copyName,
            sourcePack.Description,
            sourcePack.PackType,
            latestVersion.ContentJson,
            ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackDuplicated,
                DataJson = JsonSerializer.Serialize(new { sourcePolicyPackId = policyPackId, duplicate.PolicyPackId }),
            },
            ct);

        return duplicate;
    }

    private async Task<PolicyPackVersion?> ResolvePackVersionAsync(
        Guid policyPackId,
        string version,
        CancellationToken ct)
    {
        PolicyPackVersion? exactMatch = await versionRepository
            .GetByPackAndVersionAsync(policyPackId, version, ct)
            .ConfigureAwait(false);

        if (exactMatch is not null)
            return exactMatch;

        IReadOnlyList<PolicyPackVersion> versions = await versionRepository
            .ListByPackAsync(policyPackId, ct)
            .ConfigureAwait(false);

        return versions.FirstOrDefault(
            row => string.Equals(row.Version, version, StringComparison.OrdinalIgnoreCase));
    }
}
