using System.Globalization;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Rendering;
using ArchLucid.Application.Operator;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     One-page QuestPDF Sponsor report keyed to a single run plus tenant pilot scorecard aggregates (read-only).
/// </summary>
/// <remarks>
///     The headline numbers come from <see cref = "IPilotRunDeltaComputer"/> so the sponsor PDF, the Markdown sibling
///     (<see cref = "FirstValueReportBuilder"/>), and the canonical first-value-report PDF wrapper all show the same
///     computed deltas. Demo tenants stamp an illustration watermark (<c>ILLUSTRATION ONLY — not a commitment</c>) in
///     <c>page.Header()</c> on every page (Markdown banners elsewhere remain unchanged) so seeded numbers cannot be quoted as a real-customer outcome.
/// </remarks>
public sealed class SponsorOnePagerPdfBuilder(
    IRunDetailQueryService runDetailQuery,
    PilotScorecardBuilder scorecardBuilder,
    IPilotRunDeltaComputer deltaComputer,
    IFirstValueReportBuilder firstValueReportBuilder,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IScopeContextProvider scopeContextProvider,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IRunRepository runRepository,
    IArchitectureInventoryBindingRepository architectureInventoryBindingRepository,
    IConfiguration configuration,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions)
{
    private const string IllustrationOnlyPerPageHeader = "ILLUSTRATION ONLY — not a commitment";
    private readonly IPilotRunDeltaComputer _deltaComputer = deltaComputer ?? throw new ArgumentNullException(nameof(deltaComputer));
    private readonly IFirstValueReportBuilder _firstValueReportBuilder =
        firstValueReportBuilder ?? throw new ArgumentNullException(nameof(firstValueReportBuilder));
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureInventoryBindingRepository _architectureInventoryBindingRepository =
        architectureInventoryBindingRepository ?? throw new ArgumentNullException(nameof(architectureInventoryBindingRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));
    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions = publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));
    private readonly IRunDetailQueryService _runDetailQuery = runDetailQuery ?? throw new ArgumentNullException(nameof(runDetailQuery));
    private readonly PilotScorecardBuilder _scorecardBuilder = scorecardBuilder ?? throw new ArgumentNullException(nameof(scorecardBuilder));

    /// <summary>Returns PDF bytes, or <see langword="null"/> when the run is missing.</summary>
    public async Task<Byte[]?> BuildPdfAsync(string runId, string baseUrlForFooter, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(baseUrlForFooter);
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));
        ArchitectureRunDetail? detail = await _runDetailQuery.GetRunDetailAsync(runId, cancellationToken);
        if (detail is null)
            return null;

        if (detail.IsCommitted && !detail.HasBrokenManifestReference)
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId);

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
        }

        string footer = PilotExportLinkHonestyCopy.TryNormalizeReviewLinkBase(baseUrlForFooter, out string normalizedFooter)
            ? normalizedFooter
            : string.Empty;
        FirstValueReportBuildResult? sponsorGate = await _firstValueReportBuilder.BuildReportAsync(runId, footer, cancellationToken);

        if (sponsorGate is null)
            return null;

        SponsorFirstValuePdfGate.EnsureCanGenerate(sponsorGate);

        PilotRunDeltas deltas = await _deltaComputer.ComputeAsync(detail, cancellationToken);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            _agentExecutionTraceRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken,
            _runRepository,
            _architectureInventoryBindingRepository);
        IReadOnlyList<string> coverageHonestyLines =
            CareerExportCoverageHonestyComposer.RenderPlainTextLines(careerExportHonesty);
        IReadOnlyList<string> sendableCoverLines =
            SendableExportCoverComposer.RenderPlainTextLines(careerExportHonesty);
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        PilotScorecardSummary scorecard = await _scorecardBuilder.BuildAsync(start, end, cancellationToken);
        ArchitectureRun run = detail.Run;
        GoldenManifest? manifest = detail.Manifest;
        double committedRatio = scorecard.RunsInPeriod > 0
            ? scorecard.RunsWithCommittedManifest / (double)scorecard.RunsInPeriod
            : 0d;
        Guid? architectureId = await WorkingOperatorRunArchitectureIdResolver.TryResolveFromScopeProviderAsync(
            _runRepository,
            _scopeContextProvider,
            runId,
            cancellationToken);
        string reviewUiPath = WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath(run.RunId, architectureId);

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));
                page.Header().Column(header =>
                {
                    if (deltas.IsDemoTenant)
                    {
                        header.Item().Background(Colors.Yellow.Lighten3).Padding(6).Text(IllustrationOnlyPerPageHeader).Bold().FontColor(Colors.Red.Darken2)
                            .FontSize(11);
                    }

                    header.Item().Text("ArchLucid — sponsor one-pager (pilot)").Bold().FontSize(14);
                });
                page.Content().Column(column =>
                {
                    column.Item().Text(PilotSponsorOnePagerPlainTextFormatter.FormatRunHeaderLine(run.RunId)).FontSize(11);
                    column.Item().Text($"Generated (UTC): {TimeProvider.System.UtcNowDateTime():O}");
                    column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    if (coverageHonestyLines.Count > 0)
                    {
                        column.Item().PaddingTop(8).Text("Career export honesty").Bold().FontSize(12);

                        foreach (string line in coverageHonestyLines)
                        {
                            column.Item().PaddingTop(2).Text(line).FontSize(9);
                        }

                        column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    }

                    IReadOnlyList<string> feasibilityCitationLines =
                        SponsorFeasibilityHardCitationHonestyFormatter.RenderPlainTextLines(careerExportHonesty.CoverageContext.Verdict);

                    if (feasibilityCitationLines.Count > 0)
                    {
                        column.Item().PaddingTop(8).Text("Feasibility citation honesty").Bold().FontSize(12);

                        foreach (string line in feasibilityCitationLines)
                        {
                            column.Item().PaddingTop(2).Text(line).FontSize(9);
                        }

                        column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    }

                    if (sendableCoverLines.Count > 0)
                    {
                        column.Item().PaddingTop(8).Text("Sendable export cover").Bold().FontSize(12);

                        foreach (string line in sendableCoverLines)
                        {
                            column.Item().PaddingTop(2).Text(line).FontSize(9).FontColor(Colors.Grey.Darken2);
                        }

                        column.Item()
                            .PaddingTop(4)
                            .Text("Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings.")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Darken2)
                            .Italic();

                        column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    }

                    column.Item().PaddingTop(8).Text("Computed deltas (this run)").Bold().FontSize(12);
                    column.Item().Element(c => RenderComputedDeltasTable(c, deltas, sponsorGate.ProofPackageCompleteness, run, manifest));
                    column.Item().PaddingTop(4)
                        .Text(FormatPilotWindowLine(scorecard, committedRatio));
                    if (manifest is not null)
                    {
                        column.Item().PaddingTop(4).Text(
                            PilotSponsorOnePagerPlainTextFormatter.FormatCommittedManifestVersionLine(
                                manifest.Metadata.ManifestVersion));
                        column.Item().Text(
                            PilotSponsorOnePagerPlainTextFormatter.FormatSystemNameLine(manifest.SystemName));
                    }
                    else
                    {
                        column.Item().PaddingTop(4).Text("Committed manifest: not available on this run (fill baseline per docs/PILOT_ROI_MODEL.md).");
                    }

                    column.Item().PaddingTop(12).Text("Top-severity finding — evidence chain").Bold().FontSize(12);
                    column.Item().Element(c => RenderEvidenceChain(c, deltas));
                    column.Item().PaddingTop(12).Text("Illustrative waterfall (pilot activity mix)").Bold().FontSize(12);
                    column.Item().Text("Bar heights are proportional to: total runs in window, committed runs, remainder (not dollar estimates).");
                    column.Item().PaddingTop(6).Row(row =>
                    {
                        const float h1 = 80f;
                        float h2 = (float)(committedRatio * 80);
                        float h3 = Math.Max(4, 80 - h2);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Height(h1).Background(Colors.Grey.Lighten3);
                            c.Item().Text("Runs in window").FontSize(8).AlignCenter();
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Height(h2).Background(Colors.Blue.Lighten3);
                            c.Item().Text("Committed").FontSize(8).AlignCenter();
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Height(h3).Background(Colors.Green.Lighten3);
                            c.Item().Text("Other").FontSize(8).AlignCenter();
                        });
                    });
                    column.Item().PaddingTop(12).Text("Canonical narrative").Bold();
                    column.Item().Text(
                        "Repository docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md and docs/go-to-market/ROI_MODEL.md — this PDF is a pointer, not a substitute for those documents.");
                    column.Item().PaddingTop(10).Text(
                        PilotExportLinkHonestyCopy.IsReviewLinkBaseStored(footer)
                            ? $"Deep link (API): {footer}/v1/architecture/review/{run.RunId}"
                            : $"Deep link (API): {PilotExportLinkHonestyCopy.ReviewLinkBaseNotStored}");
                    string ui = _publicSiteOptions.CurrentValue.BaseUrl.Trim().TrimEnd('/');
                    column.Item().PaddingTop(8).Text("Return to operator UI").Bold().FontSize(11);
                    column.Item().Text($"{ui}{reviewUiPath}");
                    column.Item().Text($"{ui}/scorecard");
                });
            });
        });
    }

    /// <summary>
    ///     Renders the four computed-delta rows (time-to-commit, findings total, LLM calls, audit rows) as a 2-column
    ///     table.
    /// </summary>
    private static void RenderComputedDeltasTable(
        IContainer column,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse? proofCompleteness,
        ArchitectureRun run,
        GoldenManifest? manifest)
    {
        column.PaddingTop(4).Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2);
                c.RelativeColumn(3);
            });
            AddDeltaRow(
                table,
                "Time to committed manifest",
                PilotRunDeltasTimeToCommitFormatter.FormatPlainText(deltas, proofCompleteness, run, manifest));
            AddDeltaRow(table, "Findings (total)", PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas));
            AddDeltaRow(table, "Findings by severity", PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas));
            AddDeltaRow(table, "LLM calls for this run", FormatLlmCallCount(deltas));
            AddDeltaRow(table, "Audit rows for this run", FormatAuditRows(deltas));
        });
    }

    private static void AddDeltaRow(TableDescriptor table, string label, string value)
    {
        table.Cell().Padding(2).Text(label);
        table.Cell().Padding(2).Text(value).Bold();
    }

    private static string FormatAuditRows(PilotRunDeltas deltas) =>
        PilotRunDeltasAuditRowCountFormatter.FormatPlainText(deltas);

    private static string FormatLlmCallCount(PilotRunDeltas deltas) =>
        PilotRunDeltasLlmCallCountFormatter.FormatPlainText(deltas);

    private static void RenderEvidenceChain(IContainer column, PilotRunDeltas deltas)
    {
        if (deltas.TopFindingId is null)
        {
            column.Text(PilotTopFindingEvidenceChainHonestyCopy.FormatPdfNoFindingsSkipItalicLine()).Italic();
            return;
        }

        column.Column(c =>
        {
            c.Item().Text(PilotTopFindingPresentationHonestyCopy.FormatSelectedFindingPlainLine(deltas));
            FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;
            if (chain is null)
            {
                c.Item().Text(PilotTopFindingEvidenceChainHonestyCopy.FormatPdfUnavailableItalicLine()).Italic();
                return;
            }

            c.Item().Text(PilotSponsorOnePagerPlainTextFormatter.FormatManifestVersionLine(chain.ManifestVersion));
            c.Item().Text($"Findings snapshot: {FormatGuid(chain.FindingsSnapshotId, "Findings snapshot id was not stored.")} · context: {FormatGuid(chain.ContextSnapshotId, "Context snapshot id was not stored.")}");
            c.Item().Text($"Graph snapshot: {FormatGuid(chain.GraphSnapshotId, "Graph snapshot id was not stored.")} · decision trace: {FormatGuid(chain.DecisionTraceId, "Decision trace id was not stored.")}");
            c.Item().Text($"Golden manifest: {FormatGuid(chain.GoldenManifestId, "Golden manifest id was not stored.")}");
            c.Item().Text(
                $"Related graph nodes: {PilotSponsorMaterialFindingsHonestyCopy.FormatRelatedGraphNodeCount(chain.RelatedGraphNodeIds.Count)} · agent execution traces: {PilotSponsorMaterialFindingsHonestyCopy.FormatAgentExecutionTraceCount(chain.AgentExecutionTraceIds.Count)}");
        });
    }

    private static string FormatGuid(Guid? id, string missingValue = "(none)")
    {
        return id is null ? missingValue : id.Value.ToString("D");
    }

    private static string FormatPilotWindowLine(PilotScorecardSummary scorecard, double committedRatio)
    {
        if (scorecard.RunsInPeriod == 0)
        {
            return "No runs were in the last 30 days, so a committed share was not computed.";
        }

        return $"Pilot window (last 30 days): {scorecard.RunsWithCommittedManifest} committed runs / {scorecard.RunsInPeriod} runs in scope ({committedRatio:P0}).";
    }
}
