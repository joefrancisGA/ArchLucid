using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Exports;

public sealed class RunSummaryOnePagerExportService(
    IRunDetailQueryService runDetailQueryService,
    IAgentCompletionClient completionClient,
    IOptionsMonitor<GenerateRunSummaryOptions> generateRunSummaryOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IConfiguration configuration) : IRunSummaryOnePagerExportService
{
    private const string SponsorReportPrompt =
        "You are an enterprise architect writing a board-ready brief. "
        + "Given severity counts and the top architecture findings below, write exactly three concise sentences: "
        + "(1) overall risk posture, (2) the dominant theme, (3) the recommended next step. Return ONLY the prose.";

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IOptionsMonitor<GenerateRunSummaryOptions> _generateRunSummaryOptions =
        generateRunSummaryOptions ?? throw new ArgumentNullException(nameof(generateRunSummaryOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public async Task<RunSummaryOnePagerExportResult> GenerateMarkdownAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!_generateRunSummaryOptions.CurrentValue.Enabled)
            throw new ConflictException("Run summary export is disabled. Enable AgentRuntime:GenerateRunSummary.");

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            throw new RunNotFoundException(runId.Trim());

        if (detail.HasBrokenManifestReference)
            throw new ConflictException(
                "This finalized review references an architecture snapshot that could not be loaded from storage. Resolve the broken manifest reference before exporting.");

        if (!detail.IsCommitted)
            throw new ConflictException("Export requires a finalized review with a committed architecture snapshot.");

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.Trim());

        if (Guid.TryParse(runId.Trim(), out Guid runGuid))
        {
            await ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
                runGuid,
                runId.Trim(),
                _authorityQueryService,
                _manifestHashService,
                _scopeContextProvider.GetCurrentScope(),
                cancellationToken);
        }

        IReadOnlyList<ArchitectureFinding> topFindings =
            ArchitectureReviewBoardExportDocumentFactory.SelectRunSummaryTopFindings(detail, maxCount: 5);

        string SponsorReport = await BuildSponsorReportAsync(detail, topFindings, cancellationToken);
        IReadOnlyList<string> topTitles = topFindings
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message.Trim())
            .ToArray();

        string? activeTrialExportNotice = await ActiveTrialExportNoticeResolver
            .ResolveAsync(_scopeContextProvider, _tenantRepository, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            _agentExecutionTraceRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken);

        RunSummaryOnePagerDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.CreateRunSummaryOnePager(
                detail,
                SponsorReport,
                topTitles,
                activeTrialExportNotice,
                careerExportHonestyPlainText: CareerExportCoverageHonestyComposer.FormatPlainText(careerExportHonesty));

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);
        string safeStem = SanitizeRunIdForFileName(model.RunId);

        return new RunSummaryOnePagerExportResult
        {
            Content = Encoding.UTF8.GetBytes(markdown),
            FileName = $"architecture-run-{safeStem}-sponsor-report.md",
            ContentType = "text/markdown; charset=utf-8"
        };
    }

    private async Task<string> BuildSponsorReportAsync(
        ArchitectureRunDetail detail,
        IReadOnlyList<ArchitectureFinding> topFindings,
        CancellationToken cancellationToken)
    {
        RunSummaryOnePagerDocumentModel countsOnly =
            ArchitectureReviewBoardExportDocumentFactory.CreateRunSummaryOnePager(
                detail,
                SponsorReport: "(pending)",
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
            SponsorReportPrompt,
            prompt.ToString(),
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        return string.IsNullOrWhiteSpace(raw)
            ? "Sponsor report could not be generated. Review findings directly in ArchLucid."
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
