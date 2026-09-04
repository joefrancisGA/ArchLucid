using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class AzureBoardsIntegrationsController
{
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
