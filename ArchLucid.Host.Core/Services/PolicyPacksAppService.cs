using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Decisioning.Governance.PolicyPacks;

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
public sealed class PolicyPacksAppService(
    IPolicyPackManagementService managementService,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IAuditService auditService) : IPolicyPacksAppService
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

        PolicyPackVersion packVersion = await managementService
                .PublishVersionAsync(policyPackId, version, contentJson, ct)
            ;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackVersionPublished, DataJson = JsonSerializer.Serialize(new { policyPackId, packVersion.Version }),
            },
            ct);

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
        CancellationToken ct)
    {
        PolicyPackVersion? packVersion = await versionRepository
                .GetByPackAndVersionAsync(policyPackId, version, ct)
            ;
        if (packVersion is null)
            return null;

        PolicyPackAssignment assignment = await managementService
                .AssignAsync(tenantId, workspaceId, projectId, policyPackId, version, scopeLevel, isPinned, ct)
            ;

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
                    }),
            },
            ct);

        return assignment;
    }

    /// <inheritdoc />
    public async Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct)
    {
        bool ok = await managementService.TryArchiveAssignmentAsync(tenantId, assignmentId, ct);

        if (!ok)
            return false;

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.PolicyPackAssignmentArchived, DataJson = JsonSerializer.Serialize(new { assignmentId }), },
            ct);

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> TrySoftDeletePackAsync(Guid tenantId, Guid policyPackId, CancellationToken ct)
    {
        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (pack is null || pack.TenantId != tenantId)
            return false;

        pack.IsDeleted = true;
        pack.Status = PolicyPackStatus.Retired;

        await packRepository.UpdateAsync(pack, ct);

        await auditService.LogAsync(
            new AuditEvent { EventType = "PolicyPackDeleted", DataJson = JsonSerializer.Serialize(new { policyPackId }), },
            ct);

        return true;
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
        PolicyPackVersion? latestVersion = versions.FirstOrDefault();

        if (latestVersion is null)
            return null;

        string copyName = sourcePack.Name.TrimEnd() + " (Copy)";

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
                EventType = "PolicyPackDuplicated",
                DataJson = JsonSerializer.Serialize(new { sourcePolicyPackId = policyPackId, duplicate.PolicyPackId }),
            },
            ct);

        return duplicate;
    }
}
