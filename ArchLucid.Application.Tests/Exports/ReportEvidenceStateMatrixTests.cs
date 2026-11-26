using System.Text;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.AgentEvaluation;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReportEvidenceStateMatrixTests
{
    private const string MissingTraces = "Execution traces were not stored for this run.";
    private const string EmptyTraces = "Execution traces were stored as an empty list for this run.";
    private const string StoredTraceRow = "Trace ID: order-trace-1";
    private const string MissingParent = "Parent manifest version was not stored.";
    private const string EmptyParent = "Parent manifest version was stored empty.";
    private static readonly DateTime RunCreatedUtc = new(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
    private static readonly ValueReportSnapshot ValueWindow = new(
        TenantId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId: Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId: Guid.Parse("33333333-3333-3333-3333-333333333333"),
        PeriodFromUtc: new DateTimeOffset(RunCreatedUtc),
        PeriodToUtc: new DateTimeOffset(RunCreatedUtc.AddDays(1)),
        RunStatusRows: [],
        RunsCompletedCount: 0,
        ManifestsCommittedCount: 0,
        GovernanceEventsHandledCount: 0,
        DriftAlertEventsCaughtCount: 0,
        EstimatedArchitectHoursSavedFromManifests: 0,
        EstimatedArchitectHoursSavedFromGovernanceEvents: 0,
        EstimatedArchitectHoursSavedFromDriftEvents: 0,
        EstimatedTotalArchitectHoursSaved: 0,
        EstimatedLlmCostForWindowUsd: 0,
        EstimatedLlmCostMethodologyNote: "Fixture only.",
        AnnualizedHoursValueUsd: 0,
        AnnualizedLlmCostUsd: 0,
        BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0,
        NetAnnualizedValueVersusRoiBaselineUsd: 0,
        RoiAnnualizedPercentVersusRoiBaseline: 0,
        TenantBaselineReviewCycleHours: null,
        TenantBaselineReviewCycleSource: null,
        TenantBaselineReviewCycleCapturedUtc: null,
        MeasuredAverageReviewCycleHoursForWindow: null,
        MeasuredReviewCycleSampleSize: 0,
        ReviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.NoMeasurementYet,
        ReviewCycleHoursDelta: null,
        ReviewCycleHoursDeltaPercent: null,
        FindingFeedbackNetScore: 0,
        FindingFeedbackVoteCount: 0,
        TenantBaselineManualPrepHoursPerReview: null,
        TenantBaselinePeoplePerReview: null);

    public enum StoredTraces { Missing, Empty, Populated }
    public enum FindingEvidence { Omitted, StoredEmpty, SnapshotZero, SnapshotPopulated }

    [Theory]
    [InlineData(StoredTraces.Missing, MissingTraces)]
    [InlineData(StoredTraces.Empty, EmptyTraces)]
    [InlineData(StoredTraces.Populated, StoredTraceRow)]
    public async Task Markdown_and_Docx_agree_on_execution_trace_presence(StoredTraces state, string expected)
    {
        ArchitectureAnalysisReport report = Report(parentVersion: null, state);

        string[] markdown = MarkdownRows(new MarkdownArchitectureAnalysisExportService().GenerateMarkdown(report));
        string[] docx = await DocxRowsAsync(report);

        AssertTraceState(markdown, expected);
        AssertTraceState(docx, expected);
    }

    [Theory]
    [InlineData(null, MissingParent)]
    [InlineData("", EmptyParent)]
    [InlineData("  ", EmptyParent)]
    [InlineData("version-17", "version-17")]
    public void Markdown_preserves_parent_manifest_version_state(string? parent, string expected)
    {
        string[] rows = MarkdownRows(new MarkdownArchitectureAnalysisExportService().GenerateMarkdown(Report(parent)));

        AssertSingleField(rows, "Parent Manifest Version: ", expected);
    }

    // The DOCX exporter currently collapses blank to missing. Only assert states it distinguishes.
    [Theory]
    [InlineData(null, MissingParent)]
    [InlineData("version-17", "version-17")]
    public async Task Docx_distinguishes_absent_and_recorded_parent_versions(string? parent, string expected)
    {
        string[] rows = await DocxRowsAsync(Report(parent));

        AssertSingleField(rows, "Parent Manifest Version: ", expected);
    }

    [Theory]
    [InlineData(FindingEvidence.Omitted, "`Agent findings were not stored.`")]
    [InlineData(FindingEvidence.StoredEmpty, "`No findings were stored on agent results for this run.`")]
    [InlineData(FindingEvidence.SnapshotZero, "`0 (no unmuted findings in persisted snapshot.)`")]
    [InlineData(FindingEvidence.SnapshotPopulated, "3")]
    public void First_value_markdown_keeps_finding_total_distinct_from_missing_evidence(
        FindingEvidence evidence, string expectedValue)
    {
        PilotRunDeltas deltas = Findings(evidence);
        StringBuilder markdown = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(markdown, deltas);
        string[] rows = MarkdownRows(markdown.ToString());

        string row = rows.Should().ContainSingle(r => r.StartsWith("| Findings (total) | ", StringComparison.Ordinal)).Subject;
        row.Split('|', StringSplitOptions.TrimEntries)[2].Should().Be(expectedValue);
    }

    [Theory]
    [InlineData(FindingEvidence.Omitted, false, null)]
    [InlineData(FindingEvidence.StoredEmpty, true, null)]
    [InlineData(FindingEvidence.SnapshotZero, true, null)]
    [InlineData(FindingEvidence.SnapshotPopulated, true, 3)]
    public void Buyer_proof_json_keeps_finding_availability_separate_from_severity_rows(
        FindingEvidence evidence, bool expectedPresent, int? expectedWarningCount)
    {
        var response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            Run(), Manifest(parentVersion: null), Findings(evidence), ValueWindow,
            freshnessEvaluationUtc: RunCreatedUtc.AddHours(1));

        using JsonDocument document = JsonDocument.Parse(BuyerProofPackDeltasJsonFormatter.Serialize(response));
        JsonElement payload = document.RootElement;
        payload.GetProperty("proofPackageCompleteness").GetProperty("findingsBySeverityPresent")
            .GetBoolean().Should().Be(expectedPresent);
        JsonElement severities = payload.GetProperty("findingsBySeverity");
        if (expectedWarningCount is int count)
        {
            severities.GetArrayLength().Should().Be(1);
            severities[0].GetProperty("severity").GetString().Should().Be("Warning");
            severities[0].GetProperty("count").GetInt32().Should().Be(count);
        }
        else
        {
            severities.GetArrayLength().Should().Be(0);
        }
    }

    [Theory]
    [InlineData(false, null)]
    [InlineData(true, 0)]
    [InlineData(true, 3)]
    public void Buyer_proof_json_omits_an_unmeasured_count_without_omitting_measured_zero(bool measured, int? expected)
    {
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = RunCreatedUtc,
            LlmCallCountResolved = measured,
            LlmCallCount = expected ?? 0,
        };
        using JsonDocument document = JsonDocument.Parse(
            BuyerProofPackDeltasJsonFormatter.Serialize(PilotRunDeltasResponseMapper.ToResponse(deltas)));
        JsonElement payload = document.RootElement;

        payload.GetProperty("llmCallCountResolved").GetBoolean().Should().Be(measured);
        payload.TryGetProperty("llmCallCount", out JsonElement callCount).Should().Be(expected.HasValue);
        if (expected is int count)
        {
            callCount.GetInt32().Should().Be(count);
        }
    }

    private static PilotRunDeltas Findings(FindingEvidence evidence) =>
        new()
        {
            RunCreatedUtc = RunCreatedUtc,
            ManifestCommittedUtc = RunCreatedUtc.AddMinutes(15),
            AgentResultsIncludedInDetail = evidence == FindingEvidence.StoredEmpty,
            FindingsCountsFromSnapshot = evidence is FindingEvidence.SnapshotZero or FindingEvidence.SnapshotPopulated,
            FindingsBySeverity = evidence == FindingEvidence.SnapshotPopulated
                ? [new KeyValuePair<string, int>("Warning", 3)]
                : [],
        };

    internal static ArchitectureAnalysisReport Report(string? parentVersion, StoredTraces traceState = StoredTraces.Missing) =>
        new()
        {
            Run = Run(),
            Manifest = Manifest(parentVersion),
            ExecutionTraces = traceState switch
            {
                StoredTraces.Missing => null,
                StoredTraces.Empty => [],
                StoredTraces.Populated =>
                [
                    new AgentExecutionTrace
                    {
                        AgentType = AgentType.Topology,
                        TaskId = "order-task",
                        TraceId = "order-trace-1",
                        CreatedUtc = RunCreatedUtc,
                    },
                ],
                _ => throw new ArgumentOutOfRangeException(nameof(traceState)),
            },
        };

    private static ArchitectureRun Run() =>
        new()
        {
            RunId = "order-run-21",
            RequestId = "order-request-8",
            CurrentManifestVersion = "version-18",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = RunCreatedUtc,
        };

    private static GoldenManifest Manifest(string? parentVersion) =>
        new()
        {
            RunId = "order-run-21",
            SystemName = "Order processing",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "version-18",
                ParentManifestVersion = parentVersion,
                CreatedUtc = RunCreatedUtc.AddMinutes(15),
            },
        };

    private static string[] MarkdownRows(string markdown) =>
        markdown.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(row => row.TrimStart('#').TrimStart())
            .Select(StripBullet)
            .ToArray();

    private static async Task<string[]> DocxRowsAsync(ArchitectureAnalysisReport report)
    {
        byte[] bytes = await new DocxArchitectureAnalysisExportService(new NullDiagramImageRenderer())
            .GenerateDocxAsync(report);
        using MemoryStream stream = new(bytes);
        using WordprocessingDocument docx = WordprocessingDocument.Open(stream, false);

        return docx.MainDocumentPart!.Document.Body!.Elements<Paragraph>()
            .Select(paragraph => StripBullet(paragraph.InnerText))
            .Where(row => row.Length != 0)
            .ToArray();
    }

    private static string StripBullet(string row) =>
        row.StartsWith("- ", StringComparison.Ordinal) || row.StartsWith("• ", StringComparison.Ordinal)
            ? row[2..]
            : row;

    private static void AssertTraceState(string[] rows, string expected)
    {
        rows.Should().ContainInOrder("Agent Execution Traces", expected);
        rows.Where(row => row is MissingTraces or EmptyTraces || row.StartsWith("Trace ID:", StringComparison.Ordinal))
            .Should().Equal(expected);
    }

    private static void AssertSingleField(string[] rows, string label, string value) =>
        rows.Where(row => row.StartsWith(label, StringComparison.Ordinal))
            .Should().Equal(label + value);
}
