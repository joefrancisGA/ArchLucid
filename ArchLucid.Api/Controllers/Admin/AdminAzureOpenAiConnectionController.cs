using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AiProviders;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Per-tenant Azure OpenAI BYO connection admin API (TB-872).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/settings/azure-openai-connection")]
public sealed class AdminAzureOpenAiConnectionController(
    IScopeContextProvider scopeProvider,
    ITenantAzureOpenAiConnectionService connectionService,
    ITenantAzureOpenAiConnectionProbeService probeService,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantAzureOpenAiConnectionService _connectionService =
        connectionService ?? throw new ArgumentNullException(nameof(connectionService));

    private readonly ITenantAzureOpenAiConnectionProbeService _probeService =
        probeService ?? throw new ArgumentNullException(nameof(probeService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet]
    [ProducesResponseType(typeof(TenantAzureOpenAiConnectionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantAzureOpenAiConnectionResponse>> Get(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantAzureOpenAiConnectionResponse body =
            await _connectionService.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(body);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(TenantAzureOpenAiConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upsert(
        [FromBody] TenantAzureOpenAiConnectionUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        if (!TenantAzureOpenAiConnectionUpsertValidation.TryBuildCommand(body, out _, out string? validationError))
        {
            return this.BadRequestProblem(validationError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantAzureOpenAiConnectionResponse? saved =
            await _connectionService.UpsertAsync(scope.TenantId, body, cancellationToken).ConfigureAwait(false);

        if (saved is null)
        {
            return this.BadRequestProblem(
                "Azure OpenAI connection could not be persisted.",
                ProblemTypes.ValidationFailed);
        }

        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantAzureOpenAiConnectionUpserted,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    providerConnectionId = saved.ProviderConnectionId,
                    endpointHost = new Uri(saved.Endpoint ?? "https://example.invalid").Host,
                    secretNameLength = saved.ApiKeyKeyVaultSecretName?.Length ?? 0,
                    isEnabled = saved.IsEnabled,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(saved);
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        bool removed = await _connectionService.DeleteAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (removed)
        {
            string actor = User?.Identity?.Name ?? "admin";

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TenantAzureOpenAiConnectionRemoved,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = "{}",
                },
                cancellationToken).ConfigureAwait(false);
        }

        return NoContent();
    }

    // idempotency-posture: dry-run-no-persist
    [HttpPost("probe")]
    [MutatingAuditExcluded("Audit: read-only Azure OpenAI completion probe; connection row may update probe metadata only.")]
    [ProducesResponseType(typeof(TenantAzureOpenAiConnectionProbeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantAzureOpenAiConnectionProbeResponse>> Probe(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantAzureOpenAiConnectionProbeResponse result =
            await _probeService.ProbeAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(result);
    }
}
