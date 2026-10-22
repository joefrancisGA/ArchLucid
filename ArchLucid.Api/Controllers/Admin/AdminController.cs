using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Configuration;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCaching;
using Microsoft.Extensions.Hosting;
using Microsoft.FeatureManagement;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator diagnostics (outbox depth, leader leases, feature flags).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed partial class AdminController(
    IConfiguration configuration,
    IHostEnvironment hostEnvironment,
    IAdminDiagnosticsService diagnostics,
    IFeatureManager featureManager,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ITenantReviewBoardCoverLogoStore? tenantReviewBoardCoverLogoStore) : ControllerBase
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IAdminDiagnosticsService _diagnostics =
        diagnostics ?? throw new ArgumentNullException(nameof(diagnostics));

    private readonly IFeatureManager _featureManager =
        featureManager ?? throw new ArgumentNullException(nameof(featureManager));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantReviewBoardCoverLogoStore? _tenantReviewBoardCoverLogoStore = tenantReviewBoardCoverLogoStore;

    /// <summary>Uploads a tenant-scoped PNG/JPEG cover logo for architecture review board exports.</summary>
    [HttpPost("tenant/logo")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ArchitectureReviewBoardCoverLogoValidator.MaxLogoBytes + 256)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> UploadTenantCoverLogoAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (_tenantReviewBoardCoverLogoStore is null)
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "Tenant cover logo storage is not configured for this host.");

        if (file is null || file.Length == 0)
            return this.BadRequestProblem("Logo file is required.", ProblemTypes.ValidationFailed);

        await using MemoryStream buffer = new();
        await file.CopyToAsync(buffer, cancellationToken).ConfigureAwait(false);
        byte[] bytes = buffer.ToArray();

        try
        {
            await _tenantReviewBoardCoverLogoStore.UploadAsync(bytes, cancellationToken).ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantReviewBoardCoverLogoUploaded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { logoByteLength = bytes.Length })
            },
            cancellationToken).ConfigureAwait(false);

        return NoContent();
    }

    /// <summary>
    ///     Production-profile blocking findings plus optional hosting advisor warnings (<c>archlucid config lint</c> parity).
    /// </summary>
    /// <remarks>No secrets are returned; findings mirror CLI/advisor rule names.</remarks>
    [HttpGet("config-lint")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(AdminConfigLintResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminConfigLintResponse> GetConfigLint([FromQuery] bool includeAdvisory = true)
    {
        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(_configuration, _hostEnvironment.EnvironmentName);

        AdminConfigLintResponse response = new()
        {
            HostingEnvironmentName = snapshot.HostingEnvironmentName,
            Ok = snapshot.Ok,
            BlockingFindings = snapshot.BlockingFindings
                .Select(static f => new AdminConfigLintFinding { RuleName = f.RuleName, Message = f.Message })
                .ToList(),
            AdvisoryFindings =
                includeAdvisory
                    ? snapshot.AdvisoryFindings
                        .Select(static f => new AdminConfigLintFinding { RuleName = f.RuleName, Message = f.Message })
                        .ToList()
                    : []
        };

        return Ok(response);
    }

    /// <summary>
    ///     Catalog-aligned key presence; set <paramref name="includeEffectiveValues" /> for redacted/effective scalars
    ///     (never returns raw secrets).
    /// </summary>
    [HttpGet("config-summary")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(AdminConfigSummaryResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminConfigSummaryResponse> GetConfigSummary([FromQuery] bool includeEffectiveValues = false) =>
        Ok(BuildAdminConfigSummary(includeEffectiveValues));

    /// <inheritdoc cref="GetConfigSummary" />
    [HttpGet("configuration/summary")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(AdminConfigSummaryResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminConfigSummaryResponse> GetConfigurationSummary([FromQuery] bool includeEffectiveValues = false)
        => Ok(BuildAdminConfigSummary(includeEffectiveValues));

    private AdminConfigSummaryResponse BuildAdminConfigSummary(bool includeEffectiveValues)
    {
        List<ConfigSummaryKeyRow> keys = new(ConfigurationKeyCatalog.All.Count);

        foreach (ConfigurationKeyEntry entry in ConfigurationKeyCatalog.All)
        {
            bool isSet = ConfigurationKeyPresence.IsValuePresent(_configuration, entry.ConfigPath);
            ConfigSummaryKeyRow row = new()
            {
                Section = entry.Section,
                ConfigPath = entry.ConfigPath,
                IsSet = isSet,
                RequirementKind = entry.Requirement.ToString(),
                Description = entry.Description,
                Sources = entry.ConfigurationSources
            };

            if (includeEffectiveValues)
            {
                row.EffectiveValue = ConfigurationEffectiveValueResolver.Resolve(_configuration, entry.ConfigPath, isSet);
            }

            keys.Add(row);
        }

        return new AdminConfigSummaryResponse { Keys = keys };
    }
}
