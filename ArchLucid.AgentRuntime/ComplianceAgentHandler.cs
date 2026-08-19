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
using ArchLucid.Retrieval.Compliance;
using ArchLucid.Retrieval.Evaluation;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="Contracts.Common.AgentType.Compliance" /> handler: evaluates policies and controls from the evidence
///     package via the completion client.
/// </summary>
public sealed class ComplianceAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    ISchemaRemediationAgentCompletionClient schemaRemediationClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ITechnologyLedgerRepository technologyLedgerRepository,
    IRetrievalQueryService retrievalQueryService,
    IRetrievalCitationFormatter retrievalCitationFormatter,
    IRetrievalGroundingTraceWriter retrievalGroundingTraceWriter,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    ILogger<ComplianceAgentHandler> logger)
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

    private readonly IRetrievalQueryService _retrievalQueryService =
        retrievalQueryService ?? throw new ArgumentNullException(nameof(retrievalQueryService));

    private readonly IRetrievalCitationFormatter _retrievalCitationFormatter =
        retrievalCitationFormatter ?? throw new ArgumentNullException(nameof(retrievalCitationFormatter));

    private readonly IRetrievalGroundingTraceWriter _retrievalGroundingTraceWriter =
        retrievalGroundingTraceWriter ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceWriter));

    private readonly ILogger<ComplianceAgentHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AgentType AgentType => AgentType.Compliance;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Compliance;

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
            .ResolveAsync(AgentType.Compliance, tenantId, runGuid, cancellationToken);
        string systemPrompt = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            systemResolved.Text,
            AgentType.Compliance,
            effectiveCloudTarget);
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();

        string baseUserPrompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildComplianceUserPrompt(runId, request, evidence, task, effectiveCloudTarget),
            ledgerEntries);
        IReadOnlyList<RetrievalHit> policyPackHits = [];
        (baseUserPrompt, policyPackHits) = await AppendPolicyPackRetrievalAsync(
            request,
            runId,
            baseUserPrompt,
            cancellationToken).ConfigureAwait(false);

        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(
                    tierCompletionRouter,
                    schemaRemediationClient,
                    AgentType.Compliance,
                    task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Compliance,
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

            string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);
            RecordRetrievalFaithfulness(policyPackHits, parsedJson, tenantId);

            parsed.PromptVariantKey = systemResolved.PromptVariantKey;
            AgentResultFindingEnforcementTierApplier.Apply(parsed);

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryPeek(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException sv)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    _scopeContextProvider,
                    sv,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            if (!AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex))
            {
                await traceRecorder.RecordAsync(
                    runId,
                    task.TaskId,
                    AgentType.Compliance,
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

    private async Task<(string Prompt, IReadOnlyList<RetrievalHit> Hits)> AppendPolicyPackRetrievalAsync(
        ArchitectureRequest request,
        string runId,
        string baseUserPrompt,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            RetrievalQuery query = new()
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                QueryText = CompliancePolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request),
                TopK = 6,
                IncludePlatformCorpora = true,
            };

            IReadOnlyList<RetrievalHit> hits =
                await _retrievalQueryService.SearchAsync(query, cancellationToken).ConfigureAwait(false);

            if (hits.Count == 0 && _logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Compliance agent policy-pack retrieval returned zero hits for tenant {TenantId}.",
                    scope.TenantId);
            }

            string block = CompliancePolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(
                hits,
                _retrievalCitationFormatter);
            string prompt = baseUserPrompt.TrimEnd() + "\n\n" + block + "\n";

            await AppendGroundingTraceAsync(scope, runId, query, hits, cancellationToken).ConfigureAwait(false);

            return (prompt, hits);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Compliance agent policy-pack retrieval failed; continuing fail-open for tenant {TenantId}.",
                    scope.TenantId);
            }

            RetrievalQuery failedQuery = new()
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                QueryText = CompliancePolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request),
                TopK = 6,
                IncludePlatformCorpora = true,
            };

            await AppendGroundingTraceAsync(scope, runId, failedQuery, [], cancellationToken).ConfigureAwait(false);

            string prompt = baseUserPrompt.TrimEnd()
                + "\n\n"
                + CompliancePolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock([], _retrievalCitationFormatter)
                + "\n";

            return (prompt, []);
        }
    }

    private static void RecordRetrievalFaithfulness(IReadOnlyList<RetrievalHit> hits, string agentOutputText, Guid tenantId)
    {
        if (hits.Count == 0)
            return;

        RetrievalFaithfulnessEvaluator.EvaluateAndRecord(hits, agentOutputText, tenantId);
    }

    private async Task AppendGroundingTraceAsync(
        ScopeContext scope,
        string runId,
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            return;

        RetrievalGroundingTraceInsert insert = RetrievalGroundingTraceBuilder.Build(
            scope,
            runGuid,
            AgentType.Compliance.ToString(),
            query,
            hits);

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
                    "Failed to persist retrieval grounding trace for compliance agent run {RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
