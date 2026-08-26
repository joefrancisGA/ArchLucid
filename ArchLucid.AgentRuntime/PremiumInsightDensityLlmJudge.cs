using System.Diagnostics;
using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
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
    IOptionsMonitor<AgentModelTierOptions> tierOptions,
    IInsightDensityGateOptionsResolver gateOptionsResolver,
    IConfiguration configuration,
    ILogger<PremiumInsightDensityLlmJudge> logger) : IInsightDensityLlmJudge
{
    private const string JudgePathEngine = "engine";
    private const string JudgePathArchitecture = "architecture";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IInsightDensityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<PremiumInsightDensityLlmJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ApplyToFindingsAsync(
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        if (!IsLlmJudgeOperational() || !options.EnableLlmJudgeForEngineFindings)
        {
            return;
        }

        List<Finding> candidates = findings
            .Where(IsEngineJudgeCandidate)
            .ToList();

        if (candidates.Count == 0)
        {
            return;
        }

        (IReadOnlyList<Finding> judgedFindings, int skippedByCap) = SelectJudgedCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathEngine, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return;
        }

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();

        foreach (Finding finding in judgedFindings)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await JudgeOneEngineFindingAsync(
                finding,
                completionClient,
                systemPrompt,
                cancellationToken);

            RecordJudgeCompletion(JudgePathEngine);
        }
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

        InsightDensityGateOptions options = _gateOptionsResolver.Resolve(cancellationToken);

        List<ArchitectureFinding> candidates = findings
            .Where(static finding => finding.Treatment == FindingTreatment.Promote)
            .ToList();

        if (candidates.Count == 0)
        {
            return;
        }

        (IReadOnlyList<ArchitectureFinding> judgedFindings, int skippedByCap) = SelectJudgedArchitectureCandidates(
            candidates,
            options.MaxJudgedFindingsPerSnapshot);

        if (skippedByCap > 0)
        {
            RecordSkippedByCap(JudgePathArchitecture, skippedByCap);
        }

        if (judgedFindings.Count == 0)
        {
            return;
        }

        (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
            InsightDensityJudgeAgentTypeNames.Judge,
            taskTierOverride: null);

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();

        foreach (ArchitectureFinding finding in judgedFindings)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await JudgeOneFindingAsync(
                finding,
                evidence,
                request,
                completionClient,
                systemPrompt,
                cancellationToken);

            RecordJudgeCompletion(JudgePathArchitecture);
        }
    }

    private async Task JudgeOneEngineFindingAsync(
        Finding finding,
        IAgentCompletionClient completionClient,
        string systemPrompt,
        CancellationToken cancellationToken)
    {
        string userPrompt = BuildEngineFindingUserPrompt(finding);
        HashSet<string> allowedRefs = InsightDensityEngineFindingEvidenceSummary.CollectAllowedEvidenceRefs(finding);

        try
        {
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken);

            InsightDensityLlmJudgment? judgment = InsightDensityLlmJudgmentParser.TryParse(rawJson, finding.FindingId);

            if (judgment is null)
            {
                _logger.LogDebug(
                    "Insight-density LLM judge returned unparsable output for engine finding {FindingId}.",
                    finding.FindingId);

                return;
            }

            if (!InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithfulForEngineFinding(
                    judgment,
                    finding,
                    allowedRefs))
            {
                _logger.LogWarning(
                    "Insight-density LLM judge output failed faithfulness for engine finding {FindingId}; retaining Phase 1 output.",
                    finding.FindingId);

                return;
            }

            FindingInsightDensityLlmJudgmentApplicator.ApplyEnrichmentToFinding(finding, judgment);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Insight-density LLM judge failed for engine finding {FindingId}; retaining Phase 1 gate output.",
                finding.FindingId);
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
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: null, cancellationToken: cancellationToken);

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

    private static bool IsEngineJudgeCandidate(Finding finding)
    {
        if (finding.Treatment != FindingTreatment.Promote)
        {
            return false;
        }

        return finding.Classification is null
            || finding.Classification == FindingClassification.DecisionGradeFinding;
    }

    private static (IReadOnlyList<Finding> Judged, int SkippedByCap) SelectJudgedCandidates(
        IReadOnlyList<Finding> candidates,
        int maxJudgedFindingsPerSnapshot)
    {
        List<Finding> ordered = candidates
            .OrderByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.InsightDensityScore ?? int.MaxValue)
            .ThenBy(static finding => finding.FindingId, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count <= maxJudgedFindingsPerSnapshot)
        {
            return (ordered, 0);
        }

        int skipped = ordered.Count - maxJudgedFindingsPerSnapshot;

        return (ordered.Take(maxJudgedFindingsPerSnapshot).ToList(), skipped);
    }

    private static (IReadOnlyList<ArchitectureFinding> Judged, int SkippedByCap) SelectJudgedArchitectureCandidates(
        IReadOnlyList<ArchitectureFinding> candidates,
        int maxJudgedFindingsPerSnapshot)
    {
        List<ArchitectureFinding> ordered = candidates
            .OrderByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.InsightDensityScore ?? int.MaxValue)
            .ThenBy(static finding => finding.FindingId, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count <= maxJudgedFindingsPerSnapshot)
        {
            return (ordered, 0);
        }

        int skipped = ordered.Count - maxJudgedFindingsPerSnapshot;

        return (ordered.Take(maxJudgedFindingsPerSnapshot).ToList(), skipped);
    }

    private static void RecordJudgeCompletion(string path)
    {
        TagList tags = new() { { "path", path } };
        ArchLucidInstrumentation.InsightDensityJudgeCompletionsTotal.Add(1, tags);
    }

    private static void RecordSkippedByCap(string path, int skippedCount)
    {
        TagList tags = new() { { "path", path } };
        ArchLucidInstrumentation.InsightDensityJudgeSkippedByCapTotal.Add(skippedCount, tags);
    }

    private static void DemoteForUnfaithfulJudgment(ArchitectureFinding finding)
    {
        finding.Treatment = FindingTreatment.DemoteToChecklist;
        finding.Classification = FindingClassification.ChecklistCoverage;
    }

    private static string BuildEngineFindingUserPrompt(Finding finding)
    {
        StringBuilder builder = new();

        builder.AppendLine("Judge this ONE deterministic engine finding for insight density.");
        builder.AppendLine();
        builder.AppendLine("Candidate finding JSON:");
        builder.AppendLine("{");
        builder.AppendLine($"  \"findingId\": \"{finding.FindingId}\",");
        builder.AppendLine($"  \"engineType\": \"{EscapeJson(finding.EngineType)}\",");
        builder.AppendLine($"  \"severity\": \"{finding.Severity}\",");
        builder.AppendLine($"  \"title\": \"{EscapeJson(finding.Title)}\",");
        builder.AppendLine($"  \"rationale\": \"{EscapeJson(finding.Rationale)}\",");
        builder.AppendLine($"  \"category\": \"{EscapeJson(finding.Category)}\"");
        builder.AppendLine("}");
        builder.AppendLine();
        builder.AppendLine("Engine evidence summary (cite ONLY refs present here):");
        builder.AppendLine(InsightDensityEngineFindingEvidenceSummary.Build(finding));

        return builder.ToString();
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
        if (!_gateOptionsResolver.Resolve().EnableLlmJudge)
        {
            return false;
        }

        AgentModelTierOptions tiers = _tierOptions.CurrentValue;
        string? premiumDeployment = tiers.PremiumDeploymentName ?? _configuration["Llm:Deployments:Reasoning"];

        return !string.IsNullOrWhiteSpace(premiumDeployment);
    }
}
