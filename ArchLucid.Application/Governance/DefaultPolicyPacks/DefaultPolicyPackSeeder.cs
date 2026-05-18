using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <inheritdoc cref="IDefaultPolicyPackSeeder" />
public sealed class DefaultPolicyPackSeeder(
    IPolicyPackManagementService managementService,
    IPolicyPackRepository packRepository,
    ILogger<DefaultPolicyPackSeeder> logger) : IDefaultPolicyPackSeeder
{
    private readonly IPolicyPackManagementService _managementService =
        managementService ?? throw new ArgumentNullException(nameof(managementService));

    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly ILogger<DefaultPolicyPackSeeder> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task EnsureDefaultPolicyPacksAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        IReadOnlyList<PolicyPack> existing =
            await _packRepository.ListByScopeAsync(tenantId, workspaceId, projectId, ct);

        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();

        foreach (DefaultPolicyPackBundleDefinition bundle in bundles)
        {
            await EnsureOnePackAsync(
                tenantId,
                workspaceId,
                projectId,
                existing,
                bundle.DisplayName,
                bundle.Description,
                bundle.ContentJson,
                ct);
        }
    }

    private async Task EnsureOnePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<PolicyPack> existing,
        string displayName,
        string description,
        string contentJson,
        CancellationToken ct)
    {
        if (HasPlatformPack(existing, displayName))
            return;

        PolicyPack created = await _managementService
                .CreatePackAsync(
                    tenantId,
                    workspaceId,
                    projectId,
                    displayName,
                    description,
                    PolicyPackType.PlatformDefault,
                    contentJson,
                    ct)
            ;

        await _managementService.PublishVersionAsync(created.PolicyPackId, "1.0.0", contentJson, ct);

        await _managementService.AssignAsync(
            tenantId,
            workspaceId,
            projectId,
            created.PolicyPackId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            isPinned: false,
            ct);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Seeded platform default policy pack {PackId} ({Name}) for tenant {TenantId}.",
                created.PolicyPackId,
                displayName,
                tenantId);
    }

    private static bool HasPlatformPack(IReadOnlyList<PolicyPack> packs, string displayName)
    {
        foreach (PolicyPack pack in packs)
        {
            if (!string.Equals(pack.PackType, PolicyPackType.PlatformDefault, StringComparison.Ordinal))
                continue;

            if (string.Equals(pack.Name, displayName, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
