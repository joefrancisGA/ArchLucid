using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Agents;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform operator curation for the agent model catalog (TB-2103).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/agent-model-catalog")]
[EnableRateLimiting("fixed")]
public sealed class AdminAgentModelCatalogController(
    IAgentModelCatalogRepository catalogRepository,
    IAgentModelCatalogEvaluationRecorder evaluationRecorder,
    IAgentModelCatalogFaithfulnessHarnessImporter faithfulnessHarnessImporter,
    IAgentModelCatalogCacheInvalidator cacheInvalidator,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IAgentModelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IAgentModelCatalogEvaluationRecorder _evaluationRecorder =
        evaluationRecorder ?? throw new ArgumentNullException(nameof(evaluationRecorder));

    private readonly IAgentModelCatalogFaithfulnessHarnessImporter _faithfulnessHarnessImporter =
        faithfulnessHarnessImporter ?? throw new ArgumentNullException(nameof(faithfulnessHarnessImporter));

    private readonly IAgentModelCatalogCacheInvalidator _cacheInvalidator =
        cacheInvalidator ?? throw new ArgumentNullException(nameof(cacheInvalidator));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AgentModelCatalogRow>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentModelCatalogRow> rows =
            await _catalogRepository.ListAllAsync(cancellationToken).ConfigureAwait(false);

        return Ok(rows);
    }

    [HttpPut("{aliasId}")]
    [ProducesResponseType(typeof(AgentModelCatalogRow), StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert(
        string aliasId,
        [FromBody] AgentModelCatalogRow? row,
        CancellationToken cancellationToken)
    {
        if (row is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        if (!string.Equals(row.AliasId, aliasId, StringComparison.OrdinalIgnoreCase))
        {
            return this.BadRequestProblem("Route alias id must match body alias id.", ProblemTypes.ValidationFailed);
        }

        try
        {
            AgentModelCatalogOfferability.EnsureOfferable(row);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        AgentModelCatalogRow? before = await _catalogRepository.TryGetAsync(aliasId, cancellationToken).ConfigureAwait(false);

        await _catalogRepository.UpsertAsync(row, cancellationToken).ConfigureAwait(false);
        _cacheInvalidator.Invalidate();

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "admin";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = before is null
                    ? AuditEventTypes.ModelCatalogEntryCreated
                    : AuditEventTypes.ModelCatalogEntryUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { aliasId = row.AliasId, lifecycle = row.LifecycleStatus.ToString() })
            },
            cancellationToken).ConfigureAwait(false);

        AgentModelCatalogRow? saved = await _catalogRepository.TryGetAsync(aliasId, cancellationToken).ConfigureAwait(false);

        return Ok(saved);
    }

    [HttpPost("{aliasId}/evaluations/{taskType}/record")]
    [MutatingAuditExcluded("Audit: AgentModelCatalogEvaluationRecorder logs ModelCatalogEvaluationRecorded via IAuditService.")]
    [ProducesResponseType(typeof(AgentModelCatalogRow), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordEvaluation(
        string aliasId,
        string taskType,
        [FromBody] RecordAgentModelCatalogEvaluationRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        if (!Enum.TryParse(request.EvaluationState, true, out AgentModelEvaluationStateKind evaluationState))
        {
            return this.BadRequestProblem("EvaluationState is invalid.", ProblemTypes.ValidationFailed);
        }

        string actor = User?.Identity?.Name ?? "admin";

        try
        {
            AgentModelCatalogRow saved = await _evaluationRecorder
                .RecordTaskEvaluationAsync(
                    aliasId,
                    taskType,
                    evaluationState,
                    request.EvidenceJson,
                    actor,
                    cancellationToken)
                .ConfigureAwait(false);

            return Ok(saved);
        }
        catch (KeyNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpPost("{aliasId}/evaluations/import-faithfulness-harness")]
    [MutatingAuditExcluded("Audit: AgentModelCatalogFaithfulnessHarnessImporter records evaluation evidence via IAuditService.")]
    [ProducesResponseType(typeof(AgentModelCatalogRow), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportFaithfulnessHarness(string aliasId, CancellationToken cancellationToken)
    {
        string actor = User?.Identity?.Name ?? "admin";

        try
        {
            AgentModelCatalogRow saved = await _faithfulnessHarnessImporter
                .ImportForAliasAsync(aliasId, actor, cancellationToken)
                .ConfigureAwait(false);

            return Ok(saved);
        }
        catch (KeyNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
