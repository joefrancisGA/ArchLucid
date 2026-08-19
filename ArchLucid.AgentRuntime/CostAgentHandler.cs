using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Retrieval.Pricing;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="AgentType.Cost" /> handler with multi-cloud structured retail grounding (RAG-V1-003 / TB-603).
/// </summary>
public sealed class CostAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    ISchemaRemediationAgentCompletionClient schemaRemediationClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ITechnologyLedgerRepository technologyLedgerRepository,
    CostRetailGroundingLookups retailGroundingLookups,
    IRetrievalGroundingTraceWriter retrievalGroundingTraceWriter,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<CostAgentHandler> logger)
    : IAgentHandler
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly CostRetailGroundingLookups _retailGroundingLookups =
        retailGroundingLookups ?? throw new ArgumentNullException(nameof(retailGroundingLookups));

    private readonly IRetrievalGroundingTraceWriter _retrievalGroundingTraceWriter =
        retrievalGroundingTraceWriter ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceWriter));

    private readonly ILogger<CostAgentHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AgentType AgentType => AgentType.Cost;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Cost;

    public async Task<AgentResult> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(task);

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run id '{runId}' is not a valid GUID for prompt variant resolution.");

        (CloudProvider effectiveCloudTarget, IReadOnlyList<TechnologyLedgerEntry> ledgerEntries) =
            await TechnologyLedgerUserPromptInjection.LoadAsync(
                _technologyLedgerRepository,
                _scopeContextProvider,
                runId,
                request,
                cancellationToken).ConfigureAwait(false);

        ResolvedSystemPrompt systemResolved = await systemPromptCatalog
            .ResolveAsync(AgentType.Cost, tenantId, runGuid, cancellationToken);
        string systemPrompt = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            systemResolved.Text,
            AgentType.Cost,
            effectiveCloudTarget);
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();
        CostRetailGroundingResult retailGrounding = CostRetailGroundingBuilder.Build(
            request,
            evidence,
            _retailGroundingLookups,
            effectiveCloudTarget);
        string baseUserPrompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildCostUserPrompt(
                runId,
                request,
                evidence,
                task,
                effectiveCloudTarget,
                retailGrounding),
            ledgerEntries);
        await TryPersistRetailGroundingTraceAsync(runId, request, retailGrounding, cancellationToken);
        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(
                    tierCompletionRouter,
                    schemaRemediationClient,
                    AgentType.Cost,
                    task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Cost,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                request.MaxTokensOverride,
                remediationClient,
                _logger,
                traceRecorder,
                promptRepro,
                cancellationToken);

            lastCompletionJson = rawJson;

            parsed.PromptVariantKey = systemResolved.PromptVariantKey;
            AgentResultFindingEnforcementTierApplier.Apply(parsed);

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryPeek(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException schemaViolation)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    _scopeContextProvider,
                    schemaViolation,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            if (!AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex))
            {
                await traceRecorder.RecordAsync(
                    runId,
                    task.TaskId,
                    AgentType.Cost,
                    systemPrompt,
                    baseUserPrompt,
                    lastCompletionJson,
                    null,
                    false,
                    ex.Message,
                    promptRepro,
                    inTok,
                    outTok,
                    reasoningTok,
                    modelDeploy,
                    modelVer,
                    failureReasonCode: AgentHandlerExecutionFailureReason.ResolveFailureReasonCode(ex),
                    cancellationToken: cancellationToken);
            }

            throw;
        }
    }

    internal static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget,
        CostRetailGroundingResult grounding,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries) =>
        TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildCostUserPrompt(
                runId,
                request,
                evidence,
                task,
                effectiveCloudTarget,
                grounding),
            ledgerEntries);


    private async Task TryPersistRetailGroundingTraceAsync(
        string runId,
        ArchitectureRequest request,
        CostRetailGroundingResult grounding,
        CancellationToken cancellationToken)
    {
        if (grounding.SkippedRetailGrounding)
            return;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RetrievalGroundingTraceInsert insert =
            RetailPriceRetrievalGroundingTraceMapper.BuildInsert(scope, runGuid, request, grounding);

        try
        {
            await _retrievalGroundingTraceWriter.AppendAsync(insert, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                // codeql[cs/log-forging]: run id sanitized for log sink (CWE-117).
                _logger.LogWarning(
                    ex,
                    "Failed to persist retail-price grounding trace for cost agent run {RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
