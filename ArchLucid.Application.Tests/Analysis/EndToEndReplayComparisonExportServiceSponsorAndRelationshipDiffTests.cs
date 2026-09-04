using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
/// Branch coverage for <see cref="EndToEndReplayComparisonExportService"/>: sponsor profile, guards, and
/// manifest relationship subsections on the detailed path.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EndToEndReplayComparisonExportServiceSponsorAndRelationshipDiffTests
{
    [SkippableFact]
    public void GenerateMarkdown_executive_profile_emits_key_counts_not_full_run_metadata_section()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Exec summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "L-exec", RightRunId = "R-exec", RunDiff = new RunMetadataDiffResult { ChangedFields = ["Alpha"], RequestIdsDiffer = true }
        };

        string md = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Sponsor);

        md.Should().Contain("## Key counts");
        md.Should().Contain("Run metadata: 1 changed field(s); Request IDs differ: Yes");
        md.Should().NotContain("## Run Metadata Diff");
        md.Should().Contain("### Interpretation Notes");
    }

    [SkippableFact]
    public void GenerateMarkdown_null_report_throws_ArgumentNullException()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        EndToEndReplayComparisonExportService sut = new(formatter.Object);

        Action act = () => sut.GenerateMarkdown(null!, EndToEndComparisonExportProfile.Short);

        act.Should().Throw<ArgumentNullException>().WithParameterName("report");
    }

    [SkippableFact]
    public void GenerateHtml_executive_profile_appends_interpretation_notes_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Exec summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "L",
            RightRunId = "R",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            InterpretationNotes = ["Catalog model alias differs between the two reviews."],
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Sponsor);

        html.Should().Contain("<h2>Interpretation Notes</h2>");
        html.Should().Contain("Catalog model alias differs between the two reviews.");
    }

    [SkippableFact]
    public void GenerateHtml_executive_profile_includes_key_counts_and_omits_agent_result_headings()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("summary-line");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "L",
            RightRunId = "R",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            AgentResultDiff = new AgentResultDiffResult { AgentDeltas = [] }
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Sponsor);

        html.Should().Contain("<h2>Key counts</h2>");
        html.Should().NotContain("Agent Result Diff");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "a",
            RightRunId = "b",
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

        string md = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        md.Should().Contain("### Added Relationships");
        md.Should().Contain("s1 -> t1 (calls)");
        md.Should().Contain("### Removed Relationships");
        md.Should().Contain("s2 -> t2 (reads)");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = RelationshipDiffReport();

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Should().Contain("Added relationship: s1 -&gt; t1 (calls)");
        html.Should().Contain("Removed relationship: s2 -&gt; t2 (reads)");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_includes_agent_confidence_and_required_control_diffs()
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
                        AgentType = ArchLucid.Contracts.Common.AgentType.Topology,
                        LeftExists = true,
                        RightExists = true,
                        LeftConfidence = 0.42,
                        RightConfidence = 0.88,
                        AddedRequiredControls = ["encrypt-at-rest"],
                        RemovedWarnings = ["stale inventory"],
                    }
                ]
            }
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Should().Contain("Left Confidence: 0.42");
        html.Should().Contain("Right Confidence: 0.88");
        html.Should().Contain("Added required control: encrypt-at-rest");
        html.Should().Contain("Removed warning: stale inventory");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_includes_export_request_flag_and_value_diffs()
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
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "left-export",
                    RightExportRecordId = "right-export",
                    ChangedTopLevelFields = ["TemplateProfile"],
                    RequestDiff = new ExportRecordRequestDiff
                    {
                        ChangedFlags = ["IncludeAppendix"],
                        ChangedValues = ["Format: Pdf -> Docx"],
                    },
                }
            ]
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Should().Contain("Changed request flag: IncludeAppendix");
        html.Should().Contain("Changed request value: Format: Pdf -&gt; Docx");
    }

    [SkippableFact]
    public void GenerateHtml_detailed_includes_agent_evidence_ref_diffs()
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
                        RemovedEvidenceRefs = ["policy-pack:legacy-baseline"],
                    }
                ]
            }
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Should().Contain("Added evidence reference: policy-pack:encrypt-at-rest");
        html.Should().Contain("Removed evidence reference: policy-pack:legacy-baseline");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_includes_agent_evidence_ref_diffs()
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

        string markdown = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        markdown.Should().Contain("Added Evidence References");
        markdown.Should().Contain("policy-pack:encrypt-at-rest");
    }

    private static EndToEndReplayComparisonReport RelationshipDiffReport() => new()
    {
        LeftRunId = "a",
        RightRunId = "b",
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

    [SkippableFact]
    public async Task GeneratePdfAsync_throws_when_cancellation_requested_before_render()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("x");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new() { LeftRunId = "L", RightRunId = "R" };
        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = async () => await sut.GeneratePdfAsync(report, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
