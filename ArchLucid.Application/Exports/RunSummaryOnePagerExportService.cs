using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Exports;

public sealed class RunSummaryOnePagerExportService(
    IRunDetailQueryService runDetailQueryService,
    IAgentCompletionClient completionClient) : IRunSummaryOnePagerExportService
{
    private const string ExecutiveSummaryPrompt =
        "You are an enterprise architect writing a board-ready brief. "
        + "Given severity counts and the top architecture findings below, write exactly three concise sentences: "
        + "(1) overall risk posture, (2) the dominant theme, (3) the recommended next step. Return ONLY the prose.";

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<RunSummaryOnePagerExportResult> GenerateMarkdownAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            throw new RunNotFoundException(runId.Trim());

        if (!detail.IsCommitted)
            throw new ConflictException("Export requires a finalized review with a committed architecture snapshot.");

        IReadOnlyList<ArchitectureFinding> topFindings =
            ArchitectureReviewBoardExportDocumentFactory.SelectRunSummaryTopFindings(detail, maxCount: 5);

        string executiveSummary = await BuildExecutiveSummaryAsync(detail, topFindings, cancellationToken);
        IReadOnlyList<string> topTitles = topFindings
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message.Trim())
            .ToArray();

        RunSummaryOnePagerDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.CreateRunSummaryOnePager(detail, executiveSummary, topTitles);

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);
        string safeStem = SanitizeRunIdForFileName(model.RunId);

        return new RunSummaryOnePagerExportResult
        {
            Content = Encoding.UTF8.GetBytes(markdown),
            FileName = $"architecture-run-{safeStem}-executive-summary.md",
            ContentType = "text/markdown; charset=utf-8"
        };
    }

    private async Task<string> BuildExecutiveSummaryAsync(
        ArchitectureRunDetail detail,
        IReadOnlyList<ArchitectureFinding> topFindings,
        CancellationToken cancellationToken)
    {
        RunSummaryOnePagerDocumentModel countsOnly =
            ArchitectureReviewBoardExportDocumentFactory.CreateRunSummaryOnePager(
                detail,
                executiveSummary: "(pending)",
                topFindingTitles: []);

        StringBuilder prompt = new();
        prompt.AppendLine($"Critical: {countsOnly.CriticalCount}, High: {countsOnly.HighCount}, Medium: {countsOnly.MediumCount}, Low: {countsOnly.LowCount}");
        prompt.AppendLine("Top findings:");

        foreach (ArchitectureFinding finding in topFindings)
        {
            prompt.Append("- ");
            prompt.Append(finding.Severity);
            prompt.Append(": ");
            prompt.AppendLine(string.IsNullOrWhiteSpace(finding.Message) ? finding.Category : finding.Message.Trim());
        }

        string raw = await _completionClient.CompleteJsonAsync(
            ExecutiveSummaryPrompt,
            prompt.ToString(),
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        return string.IsNullOrWhiteSpace(raw)
            ? "Executive summary could not be generated. Review findings directly in ArchLucid."
            : raw.Trim();
    }

    private static string SanitizeRunIdForFileName(string runId)
    {
        if (Guid.TryParse(runId, out Guid parsed))
            return parsed.ToString("N");

        char[] invalid = Path.GetInvalidFileNameChars();
        string trimmed = runId.Trim();

        foreach (char c in invalid)
            trimmed = trimmed.Replace(c, '-');

        return trimmed.Length > 0 ? trimmed : "run";
    }
}
