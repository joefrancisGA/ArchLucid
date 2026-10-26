using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Agents.IaC;

public sealed class FindingIacStubGenerator(
    IAgentCompletionClient completionClient,
    IAgentResultRepository agentResultRepository,
    IAgentResultEnrichmentRepository agentResultEnrichmentRepository,
    IRunRepository runRepository,
    IFindingRecordMuteRepository findingRecordMuteRepository,
    IScopeContextProvider scopeContextProvider,
    ILogger<FindingIacStubGenerator> logger) : IFindingIacStubGenerator
{
    private const string IacStubDisclaimerLine = "// AI-generated stub — review before use";

    private const string SystemPrompt =
        "You are a senior cloud infrastructure engineer. " +
        "Given an architecture finding and evidence references, return ONLY minimal Azure Bicep that addresses the finding. " +
        "The first line must be exactly: " + IacStubDisclaimerLine + " " +
        "Do not include markdown fences or prose after the Bicep.";

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IAgentResultRepository _agentResultRepository = agentResultRepository
                                                                     ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingRecordMuteRepository _findingRecordMuteRepository =
        findingRecordMuteRepository ?? throw new ArgumentNullException(nameof(findingRecordMuteRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<FindingIacStubGenerator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task GenerateAndPersistStubsForRunAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
        IReadOnlyList<AgentResult> existingResults =
            await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                _agentResultRepository,
                scope,
                canonicalRunId,
                useRollupProjection: false,
                cancellationToken).ConfigureAwait(false);

        if (existingResults.Count == 0)
            return;

        List<AgentResult> results = existingResults
            .Where(static result => result is not null)
            .Select(CloneResult)
            .ToList();

        if (results.Count == 0)
            return;
        await ApplyRelationalMuteFlagsAsync(scope, runId, results, cancellationToken).ConfigureAwait(false);

        List<AgentResult> updatedResults = [];

        foreach (AgentResult result in results)
        {
            AgentResult updatedResult = CloneResult(result);
            bool anyFindingUpdated = false;


            foreach (ArchitectureFinding finding in updatedResult.Findings ?? [])
            {

                if (finding is null
                    || finding.IsMuted
                    || !HasEvidenceReferences(finding)
                    || !AgentArchitectureFindingEmissionGate.HasTypedEmission(finding))
                    continue;

                string userPrompt = BuildPrompt(finding);
                string? stub = await TryGenerateStubAsync(runId, finding, userPrompt, cancellationToken);

                if (string.IsNullOrWhiteSpace(stub))
                    continue;

                finding.IacStub = EnsureDisclaimerLine(NormalizeLlmStubBody(stub));
                anyFindingUpdated = true;
            }


            if (anyFindingUpdated)
                updatedResults.Add(updatedResult);
        }


        if (updatedResults.Count == 0)
            return;

        foreach (AgentResult updatedResult in updatedResults)
        {
            string json = SerializeAgentResultForEnrichment(updatedResult);
            await _agentResultEnrichmentRepository
                .UpsertEnrichedResultJsonAsync(updatedResult.ResultId, json, cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static string NormalizeLlmStubBody(string stub)
    {
        string trimmed = TryUnwrapJsonStringLiteral(stub.Trim());
        trimmed = trimmed.TrimStart('\uFEFF');

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
            return trimmed;

        int firstNewline = trimmed.IndexOf('\n');

        if (firstNewline < 0)
            return trimmed;

        trimmed = trimmed[(firstNewline + 1)..].TrimStart();

        if (trimmed.EndsWith("```", StringComparison.Ordinal))
            trimmed = trimmed[..^3].TrimEnd();

        return trimmed;
    }

    private static string TryUnwrapJsonStringLiteral(string value)
    {
        if (value.Length < 2 || value[0] != '"' || value[^1] != '"')
            return value;

        try
        {
            string? unwrapped = JsonSerializer.Deserialize<string>(value);

            return string.IsNullOrEmpty(unwrapped) ? value : unwrapped;
        }
        catch (JsonException)
        {
            return value;
        }
    }

    private static string EnsureDisclaimerLine(string stub)
    {
        if (stub.StartsWith(IacStubDisclaimerLine, StringComparison.Ordinal))
            return stub;

        return IacStubDisclaimerLine + Environment.NewLine + stub;
    }

    private async Task ApplyRelationalMuteFlagsAsync(
        ScopeContext scope,
        string runId,
        List<AgentResult> results,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId.Trim(), out Guid runGuid))
            return;

        Persistence.Models.RunRecord? run = await _runRepository
            .GetByRunIdAdminAsync(runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return;

        IReadOnlyDictionary<string, FindingMuteFlag> muteFlags = await _findingRecordMuteRepository
            .GetMuteFlagsAsync(snapshotId, scope, cancellationToken)
            .ConfigureAwait(false);

        if (muteFlags.Count == 0)
            return;

        PrepareResultsForRelationalMuteApplication(results);

        FindingMuteFlagApplier.Apply(results, muteFlags);
    }

    private static void PrepareResultsForRelationalMuteApplication(List<AgentResult> results)
    {
        foreach (AgentResult result in results)
        {
            if (result is null)
                continue;

            if (result.Findings is null)
            {
                result.Findings = [];
                continue;
            }

            if (result.Findings.Exists(static finding => finding is null))
            {
                result.Findings = result.Findings
                    .Where(static finding => finding is not null)
                    .ToList();
            }
        }
    }

    private static bool HasEvidenceReferences(ArchitectureFinding finding)
    {

        if (finding is null)
            return false;

        return (finding.EvidenceRefs ?? []).Any(static reference => !string.IsNullOrWhiteSpace(reference));
    }

    private static string BuildPrompt(ArchitectureFinding finding)
    {
        StringBuilder prompt = new();
        prompt.AppendLine("Architecture finding:");
        prompt.AppendLine(finding.Message);
        prompt.AppendLine();
        prompt.AppendLine("Category:");
        prompt.AppendLine(finding.Category);
        prompt.AppendLine();
        prompt.AppendLine("Severity:");
        prompt.AppendLine(finding.Severity.ToString());
        prompt.AppendLine();
        prompt.AppendLine("Evidence references:");

        foreach (string evidenceRef in (finding.EvidenceRefs ?? []).Where(static reference => !string.IsNullOrWhiteSpace(reference)))
            prompt.AppendLine("- " + evidenceRef.Trim());

        return prompt.ToString();
    }

    private async Task<string?> TryGenerateStubAsync(
        string runId,
        ArchitectureFinding finding,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _completionClient.CompleteJsonAsync(
                SystemPrompt,
                userPrompt,
                maxTokens: null,
                temperature: null,
                cancellationToken: cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to generate IaC stub for run {RunId} finding {FindingId}.",
                LogSanitizer.Sanitize(runId),
                LogSanitizer.Sanitize(finding.FindingId));
            return null;
        }
    }

    private static AgentResult CloneResult(AgentResult source)
    {
        AgentResultEnvelopeAgentTypeResolver.EnsureFindingSourceAgents(source);

        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        if (copy is null)
            throw new InvalidOperationException("Clone produced null AgentResult.");

        copy.ProposedEvidenceJson = source.ProposedEvidenceJson;
        copy.PromptVariantKey = source.PromptVariantKey;

        return copy;
    }

    private static string SerializeAgentResultForEnrichment(AgentResult result)
    {
        AgentResultEnvelopeAgentTypeResolver.EnsureFindingSourceAgents(result);

        JsonObject root = JsonSerializer.SerializeToNode(result, ContractJson.Default)!.AsObject();

        if (!string.IsNullOrWhiteSpace(result.ProposedEvidenceJson))
            root["proposedEvidenceJson"] = result.ProposedEvidenceJson;

        if (!string.IsNullOrWhiteSpace(result.PromptVariantKey))
            root["promptVariantKey"] = result.PromptVariantKey;

        return root.ToJsonString(ContractJson.Default);
    }
}
