using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.ArtifactSynthesis.FindingVerification;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Findings;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReportRowFidelityTests
{
    private static readonly DateTime StartUtc = new(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);

    public static TheoryData<int, int, int> Permutations => new()
    {
        { 0, 1, 2 },
        { 0, 2, 1 },
        { 1, 0, 2 },
        { 1, 2, 0 },
        { 2, 0, 1 },
        { 2, 1, 0 },
    };

    [Theory]
    [MemberData(nameof(Permutations))]
    public async Task Trace_exports_keep_every_trace_and_honor_their_ordering_rules(int first, int second, int third)
    {
        AgentExecutionTrace[] traces =
        [
            Trace("trace-c", StartUtc.AddMinutes(1)),
            Trace("trace-a", StartUtc.AddMinutes(1)),
            Trace("trace-b", StartUtc),
        ];
        ArchitectureAnalysisReport report = new() { ExecutionTraces = Permute(traces, first, second, third) };

        string markdown = new MarkdownArchitectureAnalysisExportService().GenerateMarkdown(report);
        byte[] docx = await new DocxArchitectureAnalysisExportService(new NullDiagramImageRenderer()).GenerateDocxAsync(report);

        TraceIds(MarkdownLines(markdown).Select(StripListMarker))
            .Should().Equal("trace-b", "trace-a", "trace-c");

        string[] docxIds = TraceIds(ReadDocx(docx, ParagraphRows).Select(StripListMarker));
        docxIds.Should().HaveCount(3);
        docxIds[0].Should().Be("trace-b");
        // DOCX orders by creation time but currently has no ID tie-breaker.
        AssertSameRows(docxIds.Skip(1), "trace-a", "trace-c");
    }

    [Theory]
    [MemberData(nameof(Permutations))]
    public async Task Detailed_comparison_exports_keep_each_directed_relationship_in_its_diff_group(
        int first, int second, int third)
    {
        RelationshipDiffItem[] added =
        [
            Edge("checkout", "ledger", "writes", "Batch writes."),
            Edge("checkout", "ledger", "reads", "Read after write."),
            Edge("ledger", "checkout", "notifies", "Reverse direction."),
        ];
        RelationshipDiffItem[] removed =
        [
            Edge("checkout", "old-ledger", "reads", "Legacy read."),
            Edge("checkout", "old-ledger", "writes", "Legacy write."),
            Edge("old-ledger", "checkout", "notifies", "Legacy reverse."),
        ];
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "baseline-run",
            RightRunId = "candidate-run",
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships = Permute(added, first, second, third),
                RemovedRelationships = Permute(removed, third, second, first),
            },
        };
        var exporter = new EndToEndReplayComparisonExportService(new MarkdownEndToEndReplayComparisonSummaryFormatter());

        string[] markdown = MarkdownLines(exporter.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed));
        byte[] bytes = await exporter.GenerateDocxAsync(report, profile: EndToEndComparisonExportProfile.Detailed);
        string[] docx = ReadDocx(bytes, ParagraphRows);

        string[] expectedAdded =
        [
            "checkout -> ledger (writes). Batch writes.",
            "checkout -> ledger (reads). Read after write.",
            "ledger -> checkout (notifies). Reverse direction.",
        ];
        string[] expectedRemoved =
        [
            "checkout -> old-ledger (reads). Legacy read.",
            "checkout -> old-ledger (writes). Legacy write.",
            "old-ledger -> checkout (notifies). Legacy reverse.",
        ];
        AssertSameRows(ListUnder(markdown, "### Added Relationships", "- "), expectedAdded);
        AssertSameRows(ListUnder(markdown, "### Removed Relationships", "- "), expectedRemoved);
        AssertSameRows(ListUnder(docx, "Added Relationships", "• "), expectedAdded);
        AssertSameRows(ListUnder(docx, "Removed Relationships", "• "), expectedRemoved);
    }

    [Theory]
    [MemberData(nameof(Permutations))]
    public void Finding_reports_keep_distinct_ids_and_evidence_even_when_titles_repeat(int first, int second, int third)
    {
        FindingVerificationReportFindingRow[] findings =
        [
            Finding("finding-a", "Inventory check", "High", "Materialized", "trace-a", "Evidence A"),
            Finding("finding-b", "Inventory check", "Low", "Mitigated", "trace-b", "Evidence B"),
            Finding("finding-c", "Dependency check", "Medium", "Not observed", "trace-c", null),
        ];
        FindingVerificationReportDocumentModel model = new()
        {
            ReportId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            RunId = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            SourceManifestHash = "fixture-manifest-hash",
            ReportHash = "fixture-report-hash",
            CreatedUtc = StartUtc,
            Summary = new FindingVerificationReportConfirmedRateSummary
            {
                TotalResults = 3, MaterializedCount = 1, MitigatedCount = 1, NotObservedCount = 1,
                ConfirmedNumerator = 2, VerifiableDenominator = 3, ConfirmedRate = 2d / 3,
            },
            Findings = Permute(findings, first, second, third),
        };

        string[] markdown = MarkdownLines(FindingVerificationReportMarkdownRenderer.Render(model));
        byte[] docx = FindingVerificationReportDocxRenderer.Render(model);

        string[] expectedFindingRows =
        [
            "finding-a | Inventory check | High | Materialized | trace-a",
            "finding-b | Inventory check | Low | Mitigated | trace-b",
            "finding-c | Dependency check | Medium | Not observed | trace-c",
        ];
        const string independentEvidence = "Independent evidence from the source findings";
        AssertSameRows(ListUnder(markdown, "## Per-finding results", "|").Skip(2).Select(ToMarkdownCells),
            expectedFindingRows);
        AssertSameRows(ListUnder(markdown, "## " + independentEvidence, "- "),
            "finding-a: Evidence A", "finding-b: Evidence B");

        (string[] wordFindings, string[] wordEvidence) = ReadDocx(docx, body =>
        {
            Table[] perFinding = body.Elements<Table>().Where(table =>
                table.GetFirstChild<TableRow>()?.GetFirstChild<TableCell>()?.InnerText == "Finding ID").ToArray();
            perFinding.Should().ContainSingle();

            Paragraph evidenceHeading = body.Elements<Paragraph>().Should()
                .ContainSingle(paragraph => paragraph.InnerText == independentEvidence).Subject;
            Table? evidence = evidenceHeading.NextSibling<Table>();
            evidence.Should().NotBeNull();
            return (
                perFinding[0].Elements<TableRow>().Skip(1).Select(ToWordCells).ToArray(),
                evidence!.Elements<TableRow>().Select(ToWordCells).ToArray());
        });
        AssertSameRows(wordFindings, expectedFindingRows);
        AssertSameRows(wordEvidence, "finding-a | Evidence A", "finding-b | Evidence B");
    }

    private static List<T> Permute<T>(T[] input, int first, int second, int third) =>
        [input[first], input[second], input[third]];

    private static AgentExecutionTrace Trace(string id, DateTime createdUtc) =>
        new() { AgentType = AgentType.Topology, TaskId = "inventory-task", TraceId = id, CreatedUtc = createdUtc };

    private static RelationshipDiffItem Edge(string source, string target, string type, string description) =>
        new() { SourceId = source, TargetId = target, RelationshipType = type, Description = description };

    private static FindingVerificationReportFindingRow Finding(
        string id, string title, string severity, string status, string trace, string? evidence) =>
        new()
        {
            FindingId = id, Title = title, Severity = severity, Status = status, TraceText = trace,
            IndependentVerification = evidence,
        };

    private static string[] MarkdownLines(string markdown) =>
        markdown.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

    private static string[] ParagraphRows(Body body) =>
        body.Elements<Paragraph>().Select(paragraph => paragraph.InnerText.Trim())
            .Where(row => row.Length > 0).ToArray();

    private static T ReadDocx<T>(byte[] bytes, Func<Body, T> read)
    {
        using MemoryStream stream = new(bytes);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        return read(document.MainDocumentPart!.Document.Body!);
    }

    private static string[] TraceIds(IEnumerable<string> rows) =>
        rows.Where(row => row.StartsWith("Trace ID: ", StringComparison.Ordinal))
            .Select(row => row["Trace ID: ".Length..]).ToArray();

    private static string StripListMarker(string row) =>
        row.StartsWith("- ", StringComparison.Ordinal) || row.StartsWith("• ", StringComparison.Ordinal)
            ? row[2..]
            : row;

    private static IEnumerable<string> ListUnder(string[] rows, string heading, string marker)
    {
        rows.Should().ContainSingle(row => row == heading);
        return rows.Skip(Array.IndexOf(rows, heading) + 1)
            .TakeWhile(row => row.StartsWith(marker, StringComparison.Ordinal))
            .Select(row => row[marker.Length..]);
    }

    // Sort only for membership comparisons and preserve multiplicity. This catches extra as well as missing rows.
    private static void AssertSameRows(IEnumerable<string> actual, params string[] expected) =>
        actual.Order(StringComparer.Ordinal).Should().Equal(expected.Order(StringComparer.Ordinal));

    private static string ToMarkdownCells(string rowWithoutOpeningPipe) =>
        string.Join(" | ", rowWithoutOpeningPipe.Split('|', StringSplitOptions.TrimEntries)[..^1]);

    private static string ToWordCells(TableRow row) =>
        string.Join(" | ", row.Elements<TableCell>().Select(cell => cell.InnerText.Trim()));
}
