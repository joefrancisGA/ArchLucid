using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

using Moq;

using UglyToad.PdfPig;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
/// PDF/DOCX export parity with markdown/HTML: detailed appendices and interpretation-notes fallback.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EndToEndReplayComparisonPdfAndDocxParityTests
{
    [SkippableFact]
    public async Task GenerateDocx_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            InterpretationNotes = ["Catalog model alias differs between the two reviews."],
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Interpretation Notes");
        text.Should().Contain("Catalog model alias differs between the two reviews.");
    }

    [SkippableFact]
    public async Task GenerateDocx_detailed_profile_appends_warnings_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Warnings");
        text.Should().Contain("One or both manifests were unavailable for manifest comparison.");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_profile_includes_run_metadata_diff_section_not_only_key_counts()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["Status"],
                RequestIdsDiffer = true,
                StatusDiffers = true,
            },
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("Changed Field: Status");
        text.Should().NotContain("Key counts");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            InterpretationNotes = ["Structural execution mode differs between runs."],
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("between runs.");
        text.Should().NotContain("Key counts");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s1", TargetId = "t1", RelationshipType = "calls" }
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s2", TargetId = "t2", RelationshipType = "reads" }
                ]
            }
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("s1 -> t1 (calls).");
        text.Should().Contain("not stored.");
        text.Should().Contain("s2 -> t2 (reads).");
    }

    [SkippableFact]
    public async Task GenerateDocx_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s1", TargetId = "t1", RelationshipType = "calls" }
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s2", TargetId = "t2", RelationshipType = "reads" }
                ]
            }
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Added Relationships");
        text.Should().Contain("s1 -> t1 (calls). Relationship description was not stored.");
        text.Should().Contain("Removed Relationships");
        text.Should().Contain("s2 -> t2 (reads). Relationship description was not stored.");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_includes_agent_evidence_ref_diffs()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = ArchLucid.Contracts.Common.AgentType.Compliance,
                        LeftExists = true,
                        RightExists = true,
                        AddedEvidenceRefs = ["policy-pack:encrypt-at-rest"],
                    }
                ]
            }
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("policy-pack:encrypt-at-rest");
    }

    [SkippableFact]
    public async Task GeneratePdf_includes_finding_correlation_metadata_header()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint),
                PolicyRuleMatchCount = 2,
                HonestyNote = "Fuzzy matches are possible, not proven equivalence.",
            },
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        // PdfPig ligature stripping can drop "ti" from "correlation" on Helvetica exports.
        text.Should().Contain("Finding correla");
        text.Should().Contain("method:");
        text.Should().Contain(nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint));
        text.Should().Contain("Fuzzy matches are possible");
    }

    [SkippableFact]
    public async Task CompareQuality_GeneratePdf_includes_finding_lifecycle_counts()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                NewlyIdentifiedCount = 5,
                PreviouslyIdentifiedStillPresentCount = 3,
                ConfirmedResolvedCount = 2,
                UnverifiedResolvedCount = 1,
                AbsenceNotInformativeCount = 4,
                HonestyNote = "absence is not a clean bill",
            },
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        // PdfPig keeps Helvetica fi/ti ligatures as single characters, so assert the intact fragments.
        text.Should().Contain("recorded decision: 2");
        text.Should().Contain("present: 3");
        text.Should().Contain("Finding lifecycle honesty: absence is not a clean bill");
    }

    [Fact]
    public async Task CompareQuality_GenerateDocx_writes_added_claim_when_text_contains_an_xml_control_character()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        LeftExists = true,
                        RightExists = true,
                        AddedClaims = ["keep private endpoints\u0001 and 🔒 regional failover"],
                    },
                ],
            },
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("keep private endpoints and 🔒 regional failover");
        text.Should().NotContain("\u0001");
    }

    [Fact]
    public async Task CompareQuality_GenerateDocx_includes_finding_correlation_and_lifecycle_counts()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint),
                PolicyRuleMatchCount = 2,
                FuzzyMatchCount = 1,
                UnmatchedLeftCount = 4,
                UnmatchedRightCount = 3,
                HonestyNote = "Fuzzy matches are possible, not proven equivalence.",
            },
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                NewlyIdentifiedCount = 5,
                HonestyNote = "absence is not a clean bill",
            },
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Finding correlation method: PolicyRuleAndFingerprint");
        text.Should().Contain("Unmatched left findings: 4");
        text.Should().Contain("Unmatched right findings: 3");
        text.Should().Contain("Fuzzy matches are possible, not proven equivalence.");
        text.Should().Contain("Newly identified findings: 5");
        text.Should().Contain("Finding lifecycle honesty: absence is not a clean bill");
    }

    private static string ExtractDocxBodyText(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.InnerText;
    }

    private static string ExtractPdfText(byte[] pdfBytes)
    {
        using MemoryStream stream = new(pdfBytes);
        using PdfDocument document = PdfDocument.Open(stream);

        return string.Join(
            "\n",
            document.GetPages().Select(page => page.Text?.Trim() ?? string.Empty).Where(text => text.Length > 0));
    }
}
