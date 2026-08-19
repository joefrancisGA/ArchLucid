using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Premium-tier TB-382 Phase 2 judge — enriches promoted findings and demotes template-y output (TB-383).
/// </summary>
public sealed class PremiumInsightDensityLlmJudge(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<InsightDensityGateOptions> gateOptions,
    IOptionsMonitor<AgentModelTierOptions> tierOptions,
    IConfiguration configuration,
    ILogger<PremiumInsightDensityLlmJudge> logger) : IInsightDensityLlmJudge
{
    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IOptionsMonitor<InsightDensityGateOptions> _gateOptions =
        gateOptions ?? throw new ArgumentNullException(nameof(gateOptions));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<PremiumInsightDensityLlmJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default)
    {
        // Engine findings lack an evidence package in the orchestrator — Phase 2 judge requires agent evidence context.
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public async Task ApplyToArchitectureFindingsAsync(
        IReadOnlyList<ArchitectureFinding> findings,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(request);

        if (!IsLlmJudgeOperational())
        {
            return;
        }

        List<ArchitectureFinding> promoted = findings
            .Where(static finding => finding.Treatment == FindingTreatment.Promote)
            .ToList();

        if (promoted.Count == 0)
        {
            return;
        }

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();

        foreach (ArchitectureFinding finding in promoted)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await JudgeOneFindingAsync(
                finding,
                evidence,
                request,
                completionClient,
                systemPrompt,
                cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task JudgeOneFindingAsync(
        ArchitectureFinding finding,
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        IAgentCompletionClient completionClient,
        string systemPrompt,
        CancellationToken cancellationToken)
    {
        string userPrompt = BuildUserPrompt(finding, request, evidence);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            InsightDensityLlmJudgment? judgment = InsightDensityLlmJudgmentParser.TryParse(rawJson, finding.FindingId);

            if (judgment is null)
            {
                _logger.LogDebug(
                    "Insight-density LLM judge returned unparsable output for finding {FindingId}.",
                    finding.FindingId);

                return;
            }

            if (!InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithful(judgment, finding, evidence))
            {
                _logger.LogDebug(
                    "Insight-density LLM judge output failed faithfulness for finding {FindingId}; demoting.",
                    finding.FindingId);

                DemoteForUnfaithfulJudgment(finding);

                return;
            }

            FindingInsightDensityLlmJudgmentApplicator.ApplyToArchitectureFinding(finding, judgment);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Insight-density LLM judge failed for finding {FindingId}; retaining Phase 1 gate output.",
                finding.FindingId);
        }
    }

    private static void DemoteForUnfaithfulJudgment(ArchitectureFinding finding)
    {
        finding.Treatment = FindingTreatment.DemoteToChecklist;
        finding.Classification = FindingClassification.ChecklistCoverage;
    }

    private static string BuildUserPrompt(
        ArchitectureFinding finding,
        ArchitectureRequest request,
        AgentEvidencePackage evidence)
    {
        StringBuilder builder = new();

        builder.AppendLine("Judge this ONE candidate finding for insight density.");
        builder.AppendLine();
        builder.AppendLine($"SystemName: {request.SystemName}");
        builder.AppendLine($"Environment: {request.Environment}");
        builder.AppendLine($"CloudProvider: {request.CloudProvider}");
        builder.AppendLine();
        builder.AppendLine("Candidate finding JSON:");
        builder.AppendLine("{");
        builder.AppendLine($"  \"findingId\": \"{finding.FindingId}\",");
        builder.AppendLine($"  \"severity\": \"{finding.Severity}\",");
        builder.AppendLine($"  \"message\": \"{EscapeJson(finding.Message)}\",");
        builder.AppendLine($"  \"evidenceRefs\": [{string.Join(", ", finding.EvidenceRefs.Select(static reference => $"\"{reference}\""))}]");
        builder.AppendLine("}");
        builder.AppendLine();
        builder.AppendLine("Evidence package summary (cite ONLY refs present here or on the candidate):");
        builder.AppendLine(InsightDensityJudgeEvidenceSummary.Build(evidence, request));

        return builder.ToString();
    }

    private static string EscapeJson(string value) =>
        value.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("\"", "\\\"", StringComparison.Ordinal);

    private bool IsLlmJudgeOperational()
    {
        if (!_gateOptions.CurrentValue.EnableLlmJudge)
        {
            return false;
        }

        AgentModelTierOptions tiers = _tierOptions.CurrentValue;
        string? premiumDeployment = tiers.PremiumDeploymentName ?? _configuration["Llm:Deployments:Reasoning"];

        return !string.IsNullOrWhiteSpace(premiumDeployment);
    }
}
