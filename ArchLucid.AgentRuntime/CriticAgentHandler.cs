using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     <see cref="Contracts.Common.AgentType.Critic" /> handler: cross-checks the implied architecture for gaps and
///     contradictions.
/// </summary>
public sealed class CriticAgentHandler(
    IAgentCompletionClient completionClient,
    IAgentResultParser resultParser,
    IAgentExecutionTraceRecorder traceRecorder,
    IAgentSystemPromptCatalog systemPromptCatalog,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions)
    : IAgentHandler
{
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

        ResolvedSystemPrompt systemResolved = systemPromptCatalog.Resolve(AgentType.Critic);
        string systemPrompt = systemResolved.Text;
        AgentPromptActivityTags.Apply(systemResolved);
        AgentPromptReproMetadata promptRepro = systemResolved.ToReproMetadata();

        string baseUserPrompt = BuildUserPrompt(runId, request, evidence, task);

        string lastCompletionJson = string.Empty;

        try
        {
            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                AgentType.Critic,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                cancellationToken);

            lastCompletionJson = rawJson;

            string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);

            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Critic,
                systemPrompt,
                baseUserPrompt,
                rawJson,
                parsedJson,
                true,
                null,
                promptRepro,
                inTok,
                outTok,
                reasoningTok,
                modelDeploy,
                modelVer,
                cancellationToken: cancellationToken);

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
        sb.AppendLine("- Be skeptical but constructive.");
        sb.AppendLine("- Identify omissions that could materially weaken a secure Azure architecture.");
        sb.AppendLine("- Favor findings and warnings over redesign.");
        sb.AppendLine("- If observability, identity, or secret management are clearly under-specified, call that out.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }
}
