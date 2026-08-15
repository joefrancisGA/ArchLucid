using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform-wide activation for bundled policy packs (internal operations).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/platform-bundled-policy-packs")]
[EnableRateLimiting("fixed")]
public sealed class AdminPlatformBundledPolicyPacksController(
    IPlatformBundledPolicyPackRegistryRepository registryRepository,
    PlatformBundledPolicyPackRegistryBootstrapper registryBootstrapper,
    IPlatformBundledPolicyPackAvailability platformAvailability,
    IAuditService auditService) : ControllerBase
{
    private readonly IPlatformBundledPolicyPackRegistryRepository _registryRepository =
        registryRepository ?? throw new ArgumentNullException(nameof(registryRepository));

    private readonly PlatformBundledPolicyPackRegistryBootstrapper _registryBootstrapper =
        registryBootstrapper ?? throw new ArgumentNullException(nameof(registryBootstrapper));

    private readonly IPlatformBundledPolicyPackAvailability _platformAvailability =
        platformAvailability ?? throw new ArgumentNullException(nameof(platformAvailability));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Lists bundled packs and their global activation flags.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PlatformBundledPolicyPackRegistryEntry>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken ct = default)
    {
        await _registryBootstrapper.EnsureRegistrySeededAsync(ct);
        IReadOnlyList<PlatformBundledPolicyPackRegistryEntry> rows = await _registryRepository.ListAllAsync(ct);

        return Ok(rows);
    }

    /// <summary>Activates or deactivates a bundled pack for all tenants.</summary>
    [HttpPut("{bundleContentFile}/activation")]
    [ProducesResponseType(typeof(PlatformBundledPolicyPackRegistryEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetActivation(
        string bundleContentFile,
        [FromBody] SetPlatformBundledPolicyPackActivationRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return BadRequest("Request body is required.");

        await _registryBootstrapper.EnsureRegistrySeededAsync(ct);

        bool updated = await _registryRepository.TrySetGloballyActiveAsync(
            bundleContentFile,
            request.IsGloballyActive,
            ct);

        if (!updated)
            return NotFound();

        _platformAvailability.InvalidateCache();

        IReadOnlyList<PlatformBundledPolicyPackRegistryEntry> rows = await _registryRepository.ListAllAsync(ct);
        PlatformBundledPolicyPackRegistryEntry? row = rows.FirstOrDefault(
            entry => string.Equals(entry.BundleContentFile, bundleContentFile, StringComparison.OrdinalIgnoreCase));

        if (row is null)
            return NotFound();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PlatformBundledPolicyPackActivationChanged,
                DataJson = System.Text.Json.JsonSerializer.Serialize(
                    new
                    {
                        bundleContentFile = row.BundleContentFile,
                        displayName = row.DisplayName,
                        isGloballyActive = row.IsGloballyActive,
                    }),
            },
            ct);

        return Ok(row);
    }
}
