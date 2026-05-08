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
///     <see cref="Contracts.Common.AgentType.Compliance" /> handler: evaluates policies and controls from the evidence
///     package via the completion client.
/// </summary>
public sealed class ComplianceAgentHandler(
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

        ResolvedSystemPrompt systemResolved = systemPromptCatalog.Resolve(AgentType.Compliance);
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
                AgentType.Compliance,
                runId,
                task.TaskId,
                systemPrompt,
                baseUserPrompt,
                cancellationToken);

            lastCompletionJson = rawJson;

            string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);

            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok);
            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                AgentType.Compliance,
                systemPrompt,
                baseUserPrompt,
                rawJson,
                parsedJson,
                true,
                null,
                promptRepro,
                inTok,
                outTok,
                modelDeploy,
                modelVer,
                cancellationToken: cancellationToken);

            return parsed;
        }
        catch (Exception ex)
        {
            AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok);
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

        sb.AppendLine("Generate a compliance AgentResult.");
        sb.AppendLine();

        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Compliance");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        sb.AppendLine("Important guidance:");
        sb.AppendLine("- Infer mandatory controls conservatively from constraints and required capabilities.");
        sb.AppendLine("- If managed identity is explicitly required, include Managed Identity.");
        sb.AppendLine(
            "- If private endpoints or private networking are required, include Private Endpoints and/or Private Networking.");
        sb.AppendLine("- If encryption is required, include Encryption At Rest.");
        sb.AppendLine("- If secrets are likely present, include Key Vault.");
        sb.AppendLine(
            "- Prefer reusable machine-friendly findings such as ManagedIdentityRequired or PrivateNetworkingRequired.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }
}
