using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Azure Boards outbound work-item integration (PAT via Key Vault secret names).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/azure-boards")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class AzureBoardsIntegrationsController(
    IScopeContextProvider scopeProvider,
    ITenantAzureBoardsOutboundSettingsRepository settingsRepository,
    IAzureBoardsIntegrationService integrationService,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantAzureBoardsOutboundSettingsRepository _settingsRepository =
        settingsRepository ?? throw new ArgumentNullException(nameof(settingsRepository));

    private readonly IAzureBoardsIntegrationService _integrationService =
        integrationService ?? throw new ArgumentNullException(nameof(integrationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet("health")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsIntegrationHealthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHealthAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        AzureBoardsStoredHealth stored =
            await _integrationService.GetStoredHealthAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsIntegrationHealthResponse
        {
            Status = stored.Status,
            Reachable = stored.Reachable,
            Summary = stored.Summary,
            StatusCode = stored.StatusCode
        });
    }

    [HttpGet("projects")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsNamedItemsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListProjectsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<string> projects =
            await _integrationService.ListProjectsAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsNamedItemsResponse { Items = projects });
    }

    [HttpGet("projects/{project}/work-item-types")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsNamedItemsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListWorkItemTypesAsync(string project, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(project))
            return this.BadRequestProblem("project is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<string> workItemTypes =
            await _integrationService.ListWorkItemTypesAsync(scope.TenantId, project, cancellationToken)
                .ConfigureAwait(false);

        return Ok(new AzureBoardsNamedItemsResponse { Items = workItemTypes });
    }

    [HttpGet("settings")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsOutboundSettingsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettingsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantAzureBoardsOutboundSettings? row =
            await _settingsRepository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(MapSettingsResponse(scope.TenantId, row));
    }

    [HttpPut("settings")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(typeof(AzureBoardsOutboundSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutSettingsAsync(
        [FromBody] AzureBoardsOutboundSettingsUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (!AzureBoardsOutboundSettingsUpsertValidation.TryValidateProjectName(body.ProjectName, out string? projectName, out string? projectError))
            return this.BadRequestProblem(projectError!, ProblemTypes.ValidationFailed);

        if (!AzureBoardsOutboundSettingsUpsertValidation.TryValidateDefaultWorkItemType(
                body.DefaultWorkItemType,
                out string? workItemType,
                out string? workItemTypeError))
        {
            return this.BadRequestProblem(workItemTypeError!, ProblemTypes.ValidationFailed);
        }

        if (!AzureBoardsOutboundSettingsUpsertValidation.TryValidateOptionalPath(body.AreaPath, out string? areaPath, out string? areaError))
            return this.BadRequestProblem(areaError!, ProblemTypes.ValidationFailed);

        if (!AzureBoardsOutboundSettingsUpsertValidation.TryValidateOptionalPath(body.IterationPath, out string? iterationPath, out string? iterationError))
            return this.BadRequestProblem(iterationError!, ProblemTypes.ValidationFailed);

        if (!AzureBoardsOutboundSettingsUpsertValidation.TryValidateOptionalTags(body.DefaultTags, out string? defaultTags, out string? tagsError))
            return this.BadRequestProblem(tagsError!, ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantAzureBoardsOutboundSettings? existing =
            await _settingsRepository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TenantAzureBoardsOutboundSettings merged = new()
        {
            ProjectName = projectName!,
            DefaultWorkItemType = workItemType!,
            AreaPath = areaPath,
            IterationPath = iterationPath,
            DefaultTags = defaultTags,
            LastConnectionTestUtc = existing?.LastConnectionTestUtc,
            LastConnectionTestSummary = existing?.LastConnectionTestSummary,
        };

        TenantAzureBoardsOutboundSettings saved =
            await _settingsRepository.UpsertAsync(scope.TenantId, merged, cancellationToken).ConfigureAwait(false);

        AzureBoardsOutboundSettingsResponse response = MapSettingsResponse(scope.TenantId, saved);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantAzureBoardsOutboundSettingsUpserted,
                ActorUserId = User.Identity?.Name ?? "admin",
                ActorUserName = User.Identity?.Name ?? "admin",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    projectName = response.ProjectName,
                    defaultWorkItemType = response.DefaultWorkItemType,
                    hasAreaPath = !string.IsNullOrWhiteSpace(response.AreaPath),
                    hasIterationPath = !string.IsNullOrWhiteSpace(response.IterationPath),
                    hasDefaultTags = !string.IsNullOrWhiteSpace(response.DefaultTags),
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }

    // idempotency-posture: dry-run-no-persist
    [HttpPost("test-connection")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AzureBoardsConnectionTestResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestConnectionAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        AzureBoardsConnectionTestResult result =
            await _integrationService.TestConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.IntegrationAzureBoardsConnectionTested,
                ActorUserId = User.Identity?.Name ?? "operator",
                ActorUserName = User.Identity?.Name ?? "operator",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    ok = result.Ok,
                    statusCode = result.StatusCode,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsConnectionTestResponse
        {
            Ok = result.Ok,
            Summary = result.Summary,
            StatusCode = result.StatusCode
        });
    }

    private static AzureBoardsOutboundSettingsResponse MapSettingsResponse(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings? row) =>
        new()
        {
            TenantId = tenantId,
            IsConfigured = row is not null,
            ProjectName = row?.ProjectName,
            DefaultWorkItemType = row?.DefaultWorkItemType,
            AreaPath = row?.AreaPath,
            IterationPath = row?.IterationPath,
            DefaultTags = row?.DefaultTags,
            LastConnectionTestUtc = row?.LastConnectionTestUtc,
            LastConnectionTestSummary = row?.LastConnectionTestSummary,
        };
}
