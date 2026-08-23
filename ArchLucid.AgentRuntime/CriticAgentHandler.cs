using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="Contracts.Common.AgentType.Critic" /> handler: cross-checks the implied architecture for gaps and
///     contradictions.
/// </summary>
public sealed class CriticAgentHandler(
    IAgentTierCompletionRouter tierCompletionRouter,
    ISchemaRemediationAgentCompletionClient schemaRemediationClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ITechnologyLedgerRepository technologyLedgerRepository,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    IInsightDensityGate insightDensityGate,
    IInsightDensityLlmJudge insightDensityLlmJudge)
    : IAgentHandler
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IInsightDensityGate _insightDensityGate =
        insightDensityGate ?? throw new ArgumentNullException(nameof(insightDensityGate));

    private readonly IInsightDensityLlmJudge _insightDensityLlmJudge =
        insightDensityLlmJudge ?? throw new ArgumentNullException(nameof(insightDensityLlmJudge));

    public AgentType AgentType => AgentType.Critic;

    /// <inheritdoc />
    public string AgentTypeKey => AgentTypeKeys.Critic;

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
            .ResolveAsync(AgentType.Critic, tenantId, runGuid, cancellationToken);
        string systemPrompt = CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(
            systemResolved.Text,
            AgentType.Critic,
            effectiveCloudTarget);
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();

        string baseUserPrompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext(
            AgentUserPromptComposer.BuildCriticUserPrompt(runId, request, evidence, task, effectiveCloudTarget),
            ledgerEntries);

        return await AgentHandlerCompletionExecutor.CompleteWithSchemaRemediationAsync(
            tierCompletionRouter,
            schemaRemediationClient,
            resultParser,
            schemaRemediationOptions,
            traceRecorder,
            auditService,
            _scopeContextProvider,
            logger: null,
            AgentType.Critic,
            runId,
            task,
            request,
            systemPrompt,
            baseUserPrompt,
            promptRepro,
            systemResolved.PromptVariantKey,
            finalizeResultAsync: async parsed =>
            {
                CriticFindingConfidenceNormalizer.Apply(parsed);
                CriticFindingObviousnessPruner.Apply(parsed, _insightDensityGate);
                await _insightDensityLlmJudge
                    .ApplyToArchitectureFindingsAsync(parsed.Findings, evidence, request, cancellationToken)
                    .ConfigureAwait(false);
                ArchitectureFindingChecklistCoverageRouter.Apply(parsed);

                return parsed;
            },
            applyFindingEnforcementTier: false,
            consumeTokenUsageOnFailure: true,
            cancellationToken: cancellationToken);
    }
}
