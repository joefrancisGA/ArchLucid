using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

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
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
    IInsightDensityGate insightDensityGate,
    IInsightDensityLlmJudge insightDensityLlmJudge)
    : IAgentHandler
{
    private readonly IInsightDensityGate _insightDensityGate =
        insightDensityGate ?? throw new ArgumentNullException(nameof(insightDensityGate));

    private readonly IInsightDensityLlmJudge _insightDensityLlmJudge =
        insightDensityLlmJudge ?? throw new ArgumentNullException(nameof(insightDensityLlmJudge));

    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

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

        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;

        if (!AgentRunIdParser.TryParse(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run id '{runId}' is not a valid GUID for prompt variant resolution.");

        ResolvedSystemPrompt systemResolved = await systemPromptCatalog
            .ResolveAsync(AgentType.Critic, tenantId, runGuid, cancellationToken);
        string systemPrompt = systemResolved.Text;
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();

        string baseUserPrompt = BuildUserPrompt(runId, request, evidence, task);

        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(
                    tierCompletionRouter,
                    schemaRemediationClient,
                    AgentType.Critic,
                    task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Critic,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                request.MaxTokensOverride,
                remediationClient,
                logger: null,
                traceRecorder,
                promptRepro,
                cancellationToken);

            lastCompletionJson = rawJson;

            parsed.PromptVariantKey = systemResolved.PromptVariantKey;
            CriticFindingConfidenceNormalizer.Apply(parsed);
            CriticFindingObviousnessPruner.Apply(parsed, _insightDensityGate);
            await _insightDensityLlmJudge
                .ApplyToArchitectureFindingsAsync(parsed.Findings, evidence, request, cancellationToken)
                .ConfigureAwait(false);
            ArchitectureFindingChecklistCoverageRouter.Apply(parsed);

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException sv)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    scopeContextProvider,
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
                    AgentType.Critic,
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

    private static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task)
    {
        StringBuilder sb = new();

        sb.AppendLine("Generate a critic AgentResult.");
        sb.AppendLine();

        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Critic");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);

        List<EvidenceNote> stagedNotes = evidence.Notes
            .Where(static n => EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(
                n.NoteType,
                StringComparison.Ordinal))
            .ToList();

        if (stagedNotes.Count > 0)
        {
            sb.AppendLine(
                "Prior agent batch summary (bounded, redacted; execution sequencing only — not autonomous planning "
                + "beyond product scope; see docs/library/V1_SCOPE.md):");
            sb.AppendLine();

            foreach (EvidenceNote staged in stagedNotes)
            {
                if (!string.IsNullOrWhiteSpace(staged.Message))
                    sb.AppendLine(staged.Message);

                sb.AppendLine();
            }
        }

        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Challenge prior agent claims; do not restate generic Azure well-architected checklist items.");
        sb.AppendLine("- Every High/Error/Critical finding must name a specific uploaded element and state a concrete gap or dispute.");
        sb.AppendLine("- Prefer machine-friendly UnderSpecified messages (for example ObservabilityUnderSpecified) only when tied to doc:… or azureExtractor:… evidence refs.");
        sb.AppendLine("- Do NOT emit generic checklist advice (for example Enable MFA, Use HTTPS, encrypt data at rest) unless you tie it to a named element in this architecture.");
        sb.AppendLine("- Omit obvious findings entirely; downgrade any borderline generic item to severity Info with Low confidenceLevel.");
        sb.AppendLine("- Return at most 8 findings; return JSON only.");

        return sb.ToString();
    }
}
