using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator tools for LLM cost-estimation USD rates and registered agent handler discovery.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed class AdminLlmCostTuningController(
    IServiceProvider serviceProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IRegisteredAgentHandlersInspector handlersInspector) : ControllerBase
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IRegisteredAgentHandlersInspector _handlersInspector =
        handlersInspector ?? throw new ArgumentNullException(nameof(handlersInspector));

    /// <summary>Persists host-wide USD/M token rates used by <see cref="ArchLucid.AgentRuntime.ILlmCostEstimator" /> (SQL storage only).</summary>
    [HttpPost("llm-cost-tuning")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status501NotImplemented)]
    public async Task<IActionResult> PostLlmCostTuningAsync(
        [FromBody] LlmCostTuningRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ILlmCostEstimationUsdRateOverrideRepository? repository =
            _serviceProvider.GetService<ILlmCostEstimationUsdRateOverrideRepository>();

        LlmCostEstimationUsdRateOverrideCache? cache =
            _serviceProvider.GetService<LlmCostEstimationUsdRateOverrideCache>();


        if (repository is null || cache is null)
        {
            return this.NotImplementedProblem(
                "Persisted LLM cost tuning is only available when ArchLucid:StorageProvider is Sql (host rates table).",
                ProblemTypes.FeatureNotYetAvailable);
        }

        string updatedBy = _actorContext.GetActorId();

        await repository.UpsertAsync(
            request.InputUsdPerMillionTokens,
            request.OutputUsdPerMillionTokens,
            updatedBy,
            cancellationToken);

        LlmCostEstimationUsdRateOverrideRow? row = await repository.TryGetAsync(cancellationToken);


        if (row is null)
        {
            return this.BadRequestProblem(
                "Could not read back persisted LLM cost rates after update.",
                ProblemTypes.ValidationFailed);
        }

        cache.Set(row);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.LlmCostTuningUpdated,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        inputUsdPerMillionTokens = row.InputUsdPerMillionTokens,
                        outputUsdPerMillionTokens = row.OutputUsdPerMillionTokens
                    },
                    JsonSerializerOptions.Web)
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Lists DI-registered <see cref="ArchLucid.Contracts.Abstractions.Agents.IAgentHandler" /> implementations (metadata only; SQL and InMemory hosts).</summary>
    [HttpGet("custom-handlers")]
    [ProducesResponseType(typeof(IReadOnlyList<RegisteredAgentHandlerInfo>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<RegisteredAgentHandlerInfo>> GetCustomHandlers() =>
        Ok(_handlersInspector.ListHandlers());
}
