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
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

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
    AgentPolicyPackRetrievalAppender policyPackRetrievalAppender,
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

    private readonly AgentPolicyPackRetrievalAppender _policyPackRetrievalAppender =
        policyPackRetrievalAppender ?? throw new ArgumentNullException(nameof(policyPackRetrievalAppender));

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
        (baseUserPrompt, policyPackHits) = await _policyPackRetrievalAppender
            .AppendAsync(AgentType.Compliance, request, runId, baseUserPrompt, cancellationToken)
            .ConfigureAwait(false);

        return await AgentHandlerCompletionExecutor.CompleteWithSchemaRemediationAsync(
            tierCompletionRouter,
            schemaRemediationClient,
            resultParser,
            schemaRemediationOptions,
            traceRecorder,
            auditService,
            _scopeContextProvider,
            _logger,
            AgentType.Compliance,
            runId,
            task,
            request,
            systemPrompt,
            baseUserPrompt,
            promptRepro,
            systemResolved.PromptVariantKey,
            finalizeResultAsync: parsed =>
            {
                string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);
                AgentPolicyPackRetrievalAppender.RecordRetrievalFaithfulness(policyPackHits, parsedJson, tenantId);

                return Task.FromResult(parsed);
            },
            cancellationToken: cancellationToken);
    }
}
