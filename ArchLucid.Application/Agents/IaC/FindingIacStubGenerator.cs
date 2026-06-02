using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Agents.IaC;

public sealed class FindingIacStubGenerator(
    IAgentCompletionClient completionClient,
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider,
    ILogger<FindingIacStubGenerator> logger) : IFindingIacStubGenerator
{
    private const string SystemPrompt =
        "You are a senior cloud infrastructure engineer. " +
        "Given an architecture finding and evidence references, return ONLY minimal Azure Bicep that addresses the finding. " +
        "Do not include markdown fences, prose, comments, or explanation.";

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IAgentResultRepository _agentResultRepository = agentResultRepository
                                                                     ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<FindingIacStubGenerator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task GenerateAndPersistStubsForRunAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> existingResults = await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (existingResults.Count == 0)
            return;

        List<AgentResult> updatedResults = [];

        foreach (AgentResult result in existingResults)
        {
            AgentResult updatedResult = CloneResult(result);
            bool anyFindingUpdated = false;


            foreach (ArchitectureFinding finding in updatedResult.Findings)
            {

                if (!HasEvidenceReferences(finding))
                    continue;

                string userPrompt = BuildPrompt(finding);
                string? stub = await TryGenerateStubAsync(runId, finding, userPrompt, cancellationToken);

                if (string.IsNullOrWhiteSpace(stub))
                    continue;

                finding.IacStub = stub.Trim();
                anyFindingUpdated = true;
            }


            if (anyFindingUpdated)
                updatedResults.Add(updatedResult);
        }


        if (updatedResults.Count == 0)
            return;

        await _agentResultRepository.CreateManyAsync(updatedResults, cancellationToken);
    }

    private static bool HasEvidenceReferences(ArchitectureFinding finding)
    {

        if (finding is null)
            return false;

        return finding.EvidenceRefs.Any(static reference => !string.IsNullOrWhiteSpace(reference));
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

        foreach (string evidenceRef in finding.EvidenceRefs.Where(static reference => !string.IsNullOrWhiteSpace(reference)))
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
        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Claims = source.Claims.ToList(),
            EvidenceRefs = source.EvidenceRefs.ToList(),
            Confidence = source.Confidence,
            Findings = source.Findings.Select(CloneFinding).ToList(),
            ProposedChanges = source.ProposedChanges,
            ReasoningTrace = source.ReasoningTrace,
            Citations = source.Citations?.ToList(),
            CreatedUtc = source.CreatedUtc
        };
    }

    private static ArchitectureFinding CloneFinding(ArchitectureFinding source)
    {
        return new ArchitectureFinding
        {
            FindingId = source.FindingId,
            SourceAgent = source.SourceAgent,
            Severity = source.Severity,
            ConfidenceScore = source.ConfidenceScore,
            EvaluationConfidenceScore = source.EvaluationConfidenceScore,
            ConfidenceLevel = source.ConfidenceLevel,
            Category = source.Category,
            Message = source.Message,
            ReasoningTrace = source.ReasoningTrace,
            IsMuted = source.IsMuted,
            MuteReason = source.MuteReason,
            EvidenceRefs = source.EvidenceRefs.ToList(),
            IacStub = source.IacStub
        };
    }
}
