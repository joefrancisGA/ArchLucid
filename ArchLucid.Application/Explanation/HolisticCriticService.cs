using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Explanation;

public sealed class HolisticCriticService(
    IAuthorityQueryService authorityQuery,
    IRunExplanationSummaryService runExplanationSummary,
    IAgentCompletionClient completionClient) : IHolisticCriticService
{
    private const int MaxFindingLines = 12;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAuthorityQueryService _authorityQuery = authorityQuery
                                                              ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IRunExplanationSummaryService _runExplanationSummary = runExplanationSummary
        ?? throw new ArgumentNullException(nameof(runExplanationSummary));

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<HolisticCriticResponse> GenerateAsync(
        ScopeContext scope,
        Guid runId,
        HolisticCriticRequest? request,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            throw new InvalidOperationException($"Run '{runId:D}' was not found or has no committed manifest in the current scope.");

        RunExplanationSummary? summary = await _runExplanationSummary.GetSummaryAsync(scope, runId, cancellationToken);

        if (summary is null)
            throw new InvalidOperationException($"Run '{runId:D}' has no explanation summary in the current scope.");

        string userPrompt = BuildUserPrompt(detail, summary, request?.Focus);
        const string systemPrompt =
            "You are a principal enterprise architect providing a holistic, unstructured critique. "
            + "Reason laterally about blind spots, unstated assumptions, and alternatives the structured review may miss. "
            + "Return ONLY valid JSON with one key: critiqueMarkdown (string). "
            + "Use markdown headings: ## Blind spots, ## Alternative approaches, ## Sponsor questions, ## What I would push back on. "
            + "Do not emit structured finding objects or JSON schemas.";

        string responseJson = await _completionClient.CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        HolisticCriticResponseShape? shape = JsonSerializer.Deserialize<HolisticCriticResponseShape>(responseJson, JsonOptions);

        if (shape is null || string.IsNullOrWhiteSpace(shape.CritiqueMarkdown))
            throw new InvalidOperationException("Holistic critic response was empty.");

        return new HolisticCriticResponse
        {
            Disclaimer = HolisticCriticResponse.DefaultDisclaimer,
            CritiqueMarkdown = shape.CritiqueMarkdown.Trim(),
        };
    }

    private static string BuildUserPrompt(RunDetailDto detail, RunExplanationSummary summary, string? focus)
    {
        StringBuilder builder = new();
        builder.AppendLine("Review package context:");
        builder.AppendLine($"- System: {detail.Run.Description ?? detail.Run.RunId.ToString("D")}");
        builder.AppendLine($"- Overall assessment: {summary.OverallAssessment}");
        builder.AppendLine($"- Risk posture: {summary.RiskPosture}");
        builder.AppendLine($"- Finding count: {summary.FindingCount}");
        builder.AppendLine($"- Unresolved issues: {summary.UnresolvedIssueCount}");
        builder.AppendLine($"- Compliance gaps: {summary.ComplianceGapCount}");

        if (summary.ThemeSummaries.Count > 0)
        {
            builder.AppendLine("- Theme summaries:");

            foreach (string theme in summary.ThemeSummaries.Take(5))
                builder.AppendLine($"  • {theme}");
        }

        List<string> findingLines = ExtractFindingLines(detail.FindingsSnapshot);

        if (findingLines.Count > 0)
        {
            builder.AppendLine("- Sample findings (structured review output):");

            foreach (string line in findingLines)
                builder.AppendLine($"  • {line}");
        }

        if (!string.IsNullOrWhiteSpace(focus))
            builder.AppendLine($"\nOperator focus: {focus.Trim()}");

        builder.AppendLine("\nProvide an unstructured critique that goes beyond the structured findings.");

        return builder.ToString();
    }

    private static List<string> ExtractFindingLines(FindingsSnapshot? snapshot)
    {
        List<string> lines = [];

        if (snapshot?.Findings is null)
            return lines;

        foreach (Finding finding in snapshot.Findings.Take(MaxFindingLines))
        {
            string message = finding.Title?.Trim() ?? finding.Rationale?.Trim() ?? finding.FindingId;

            if (string.IsNullOrWhiteSpace(message))
                continue;

            string severity = finding.Severity.ToString();
            lines.Add($"[{severity}] {message}");
        }

        return lines;
    }

    private sealed class HolisticCriticResponseShape
    {
        [JsonPropertyName("critiqueMarkdown")]
        public string? CritiqueMarkdown
        {
            get;
            set;
        }
    }
}
