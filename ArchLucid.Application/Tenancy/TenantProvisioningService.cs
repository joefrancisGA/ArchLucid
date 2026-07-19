using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Marketing;
using ArchLucid.Core.Marketing;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref = "ITenantProvisioningService"/>
public sealed class TenantProvisioningService(
    ITenantRepository tenantRepository,
    IArchitectureProjectRepository architectureProjectRepository,
    IActorContext actorContext,
    IAuditService auditService,
    ILogger<TenantProvisioningService> logger,
    IOptionsMonitor<TenantProvisioningOptions> tenantProvisioningOptions,
    ITenantSqlCatalogProvisioner tenantSqlCatalogProvisioner,
    IDefaultPolicyPackSeeder defaultPolicyPackSeeder,
    IMarketingAttributionService marketingAttributionService,
    ITenantSettingsRepository tenantSettingsRepository) : ITenantProvisioningService
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly ILogger<TenantProvisioningService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IArchitectureProjectRepository _architectureProjectRepository =
        architectureProjectRepository ?? throw new ArgumentNullException(nameof(architectureProjectRepository));

    private readonly ITenantSqlCatalogProvisioner _tenantSqlCatalogProvisioner =
        tenantSqlCatalogProvisioner ?? throw new ArgumentNullException(nameof(tenantSqlCatalogProvisioner));

    private readonly IDefaultPolicyPackSeeder _defaultPolicyPackSeeder =
        defaultPolicyPackSeeder ?? throw new ArgumentNullException(nameof(defaultPolicyPackSeeder));

    private readonly IOptionsMonitor<TenantProvisioningOptions> _tenantProvisioningOptions =
        tenantProvisioningOptions ?? throw new ArgumentNullException(nameof(tenantProvisioningOptions));

    private readonly IMarketingAttributionService _marketingAttributionService =
        marketingAttributionService ?? throw new ArgumentNullException(nameof(marketingAttributionService));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    /// <inheritdoc/>
    public async Task<TenantProvisioningResult> ProvisionAsync(TenantProvisioningRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tenant name is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.AdminEmail) || !request.AdminEmail.Contains('@', StringComparison.Ordinal))
            throw new ArgumentException("Admin email is required.", nameof(request));

        string normalizedOrganizationName = TenantOrganizationDuplicateDetector.NormalizeOrganizationName(request.Name);
        string slug = TenantSlugNormalizer.FromName(request.Name);

        // Anonymous /v1/register resolves DefaultTenant scope; tenant-plane SQL fallbacks must run unscoped so
        // control-plane dbo.Tenants rows are visible before insert (SystemWithPerTenantCatalogs + greenfield CI).
        TenantRecord? existing = await ResolveExistingTenantForProvisionAsync(normalizedOrganizationName, slug, ct);

        if (existing is not null)
            return await BuildAlreadyProvisionedResultAsync(existing, request, slug, ct);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        string dataRegionKey = TenantProvisioningDataRegionPolicy.NormalizeRequest(request.DataRegion);

        TenantProvisioningDataRegionPolicy.Validate(dataRegionKey, _tenantProvisioningOptions.CurrentValue);

        try
        {
            using (AmbientScopeContext.Push(new ScopeContext()))
            {
                await _tenantRepository.InsertTenantAsync(
                    tenantId, request.Name.Trim(), slug, request.Tier, request.EntraTenantId, dataRegionKey, ct);
            }
        }
        catch (Exception ex) when (TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex))
        {
            TenantRecord? raced = await ResolveExistingTenantForProvisionAsync(normalizedOrganizationName, slug, ct);

            if (raced is null)
                throw;

            return await BuildAlreadyProvisionedResultAsync(raced, request, slug, ct);
        }

        ScopeContext provisionScope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, };
        using (AmbientScopeContext.Push(provisionScope))
            try
            {
                await _tenantSqlCatalogProvisioner.ProvisionTenantCatalogAsync(tenantId, TenantDatabaseNaming.SqlLogicalNameForTenant(tenantId), ct);
                await _tenantRepository.InsertWorkspaceAsync(
                    workspaceId,
                    tenantId,
                    ResolveWorkspaceDisplayName(request.WorkspaceDisplayName),
                    projectId,
                    ct);
                await _architectureProjectRepository.InsertAsync(projectId, tenantId, workspaceId, "default", ct);

                await _defaultPolicyPackSeeder.EnsureDefaultPolicyPacksAsync(tenantId, workspaceId, projectId, ct);

                // Default Advanced mode to OFF for new tenants to reduce cognitive load on first-run (Imp-2)
                await _tenantSettingsRepository.UpsertAsync(tenantId, "archlucid_nav_show_advanced", "0", ct);
                await _tenantSettingsRepository.UpsertAsync(tenantId, "archlucid_nav_show_extended", "0", ct);

                if (request.FirstTouch is not null)
                {
                    await _marketingAttributionService.PersistFirstTouchIfPresentAsync(tenantId, request.FirstTouch, ct);
                }
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Critical))
                    _logger.LogCritical(ex, "Tenant {TenantId} inserted but tenant-catalog / workspace insert failed; manual cleanup may be required.",
                        tenantId);
                throw;
            }

        string actor = string.IsNullOrWhiteSpace(request.AuditActorOverride) ? _actorContext.GetActor() : request.AuditActorOverride.Trim();
        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantProvisioned,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                DataJson = JsonSerializer.Serialize(
                    new { slug, request.AdminEmail, tier = request.Tier.ToString(), dataRegion = dataRegionKey }),
            }, ct);
        return new TenantProvisioningResult
        {
            TenantId = tenantId, DefaultWorkspaceId = workspaceId, DefaultProjectId = projectId, WasAlreadyProvisioned = false,
        };
    }

    private async Task<TenantRecord?> ResolveExistingTenantForProvisionAsync(
        string normalizedOrganizationName,
        string slug,
        CancellationToken ct)
    {
        ScopeContext unscoped = new();

        using (AmbientScopeContext.Push(unscoped))
        {
            TenantRecord? existing =
                await _tenantRepository.GetByNormalizedOrganizationNameAsync(normalizedOrganizationName, ct)
                    .ConfigureAwait(false);

            if (existing is not null)
                return existing;

            existing =
                await _tenantRepository.GetBySlugFromControlPlaneCatalogAsync(slug, ct).ConfigureAwait(false);

            if (existing is not null)
                return existing;

            return await _tenantRepository.GetBySlugAsync(slug, ct).ConfigureAwait(false);
        }
    }

    private async Task<TenantProvisioningResult> BuildAlreadyProvisionedResultAsync(
        TenantRecord existing,
        TenantProvisioningRequest request,
        string slug,
        CancellationToken ct)
    {
        string requestedRegion = TenantProvisioningDataRegionPolicy.NormalizeRequest(request.DataRegion);

        TenantProvisioningDataRegionPolicy.Validate(requestedRegion, _tenantProvisioningOptions.CurrentValue);

        if (!string.Equals(requestedRegion, TenantDataRegions.NormalizeOptional(existing.DataRegion),
                StringComparison.Ordinal))
            throw new ArgumentException(
                $"Tenant slug '{slug}' already exists under data region '{existing.DataRegion}'.",
                nameof(TenantProvisioningRequest.DataRegion));

        TenantWorkspaceLink? link = await GetFirstWorkspaceForProvisionedTenantAsync(existing.Id, ct);

        if (link is null)
            throw new InvalidOperationException($"Tenant '{existing.Id:D}' exists without a workspace row; data is inconsistent.");

        return new TenantProvisioningResult
        {
            TenantId = existing.Id,
            DefaultWorkspaceId = link.WorkspaceId,
            DefaultProjectId = link.DefaultProjectId,
            WasAlreadyProvisioned = true,
        };
    }

    private async Task<TenantWorkspaceLink?> GetFirstWorkspaceForProvisionedTenantAsync(Guid tenantId, CancellationToken ct)
    {
        ScopeContext tenantScope = new() { TenantId = tenantId };

        using (AmbientScopeContext.Push(tenantScope))
            return await _tenantRepository.GetFirstWorkspaceAsync(tenantId, ct);
    }

    private static string ResolveWorkspaceDisplayName(string? workspaceDisplayName)
    {
        if (string.IsNullOrWhiteSpace(workspaceDisplayName))
        {
            return "Default";
        }

        string trimmed = workspaceDisplayName.Trim();

        return trimmed.Length > 200 ? trimmed[..200] : trimmed;
    }
}
