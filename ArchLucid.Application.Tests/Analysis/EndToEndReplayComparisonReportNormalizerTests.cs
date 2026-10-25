using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Comparison;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class EndToEndReplayComparisonReportNormalizerTests
{
    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_whitespace_only_run_ids()
    {
        Guid rightRunGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "   ",
            RightRunId = $"  {rightRunGuid:D}  ",
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.LeftRunId.Should().BeEmpty();
        report.RightRunId.Should().Be(rightRunGuid.ToString("N"));
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_whitespace_only_roi_headline_labels()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "   ",
                    TargetSavingsLabel = "\t",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_trims_roi_headline_when_one_side_has_meaningful_savings()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "  $1200.00  ",
                    TargetSavingsLabel = "   ",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.RoiHeadline.Should().NotBeNull();
        report.CompareVerdictChromeDelta.RoiHeadline!.BaselineSavingsLabel.Should().Be("$1200.00");
        report.CompareVerdictChromeDelta.RoiHeadline.TargetSavingsLabel.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_restores_default_honesty_lines_when_whitespace_only_and_a_section_exists()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                Wk21Line = "   ",
                NonSummingLine = "\t",
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "$10.00",
                    TargetSavingsLabel = null,
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta.Should().NotBeNull();
        report.CompareVerdictChromeDelta!.Wk21Line.Should().Be(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
        report.CompareVerdictChromeDelta.NonSummingLine.Should().Be(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_whitespace_only_execution_mode_advisory_paragraph()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                ExecutionMode = new CompareVerdictChromeExecutionModeDelta
                {
                    BaselineModeLabel = "Simulator",
                    TargetModeLabel = "Real",
                    Changed = true,
                    AdvisoryParagraph = "   ",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.ExecutionMode!.AdvisoryParagraph.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_restores_gate_and_pack_defaults_for_whitespace_labels()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                GateOutcome = new CompareVerdictChromeGateOutcomeDelta
                {
                    BaselineGateLabel = "   ",
                    TargetGateLabel = " Soft infeasible ",
                    Changed = true,
                },
                PackAssignment = new CompareVerdictChromePackAssignmentDelta
                {
                    BaselineSummaryLine = "\t",
                    TargetSummaryLine = "  pack-a@1  ",
                    Changed = true,
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.GateOutcome!.BaselineGateLabel.Should().Be("Gate pending");
        report.CompareVerdictChromeDelta.GateOutcome.TargetGateLabel.Should().Be("Soft infeasible");
        report.CompareVerdictChromeDelta.PackAssignment!.BaselineSummaryLine.Should().Be("No pack assignment recorded");
        report.CompareVerdictChromeDelta.PackAssignment.TargetSummaryLine.Should().Be("pack-a@1");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_whitespace_only_execution_mode_labels()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                ExecutionMode = new CompareVerdictChromeExecutionModeDelta
                {
                    BaselineModeLabel = "   ",
                    TargetModeLabel = "  Real  ",
                    Changed = true,
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.ExecutionMode!.BaselineModeLabel.Should().BeEmpty();
        report.CompareVerdictChromeDelta.ExecutionMode.TargetModeLabel.Should().Be("Real");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_verdict_chrome_delta_when_all_sections_empty_after_normalize()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                Wk21Line = "   ",
                NonSummingLine = "\t",
                RoiHeadline = new CompareVerdictChromeRoiHeadlineDelta
                {
                    BaselineSavingsLabel = "   ",
                    TargetSavingsLabel = " ",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_removes_whitespace_only_warnings_and_interpretation_notes()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Warnings = ["   ", "  manifest missing  ", "\t"],
            InterpretationNotes = ["\n", "  catalog alias differs  "],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.Warnings.Should().Equal(["manifest missing"]);
        report.InterpretationNotes.Should().Equal(["catalog alias differs"]);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_removes_whitespace_only_run_metadata_changed_fields()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["   ", "  Status  ", "\t"],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.RunDiff.ChangedFields.Should().Equal(["Status"]);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_removes_whitespace_only_agent_result_diff_lists()
    {
        Guid rightRunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            AgentResultDiff = new AgentResultDiffResult
            {
                LeftRunId = "   ",
                RightRunId = $"  {rightRunGuid:D}  ",
                Warnings = ["  ", "  partial agent coverage  "],
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["   ", "  claim-a  "],
                        RemovedWarnings = ["\t"],
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff!.LeftRunId.Should().BeEmpty();
        report.AgentResultDiff.RightRunId.Should().Be(rightRunGuid.ToString("N"));
        report.AgentResultDiff.Warnings.Should().Equal(["partial agent coverage"]);
        AgentResultDelta delta = report.AgentResultDiff.AgentDeltas[0];
        delta.AddedClaims.Should().Equal(["claim-a"]);
        delta.RemovedWarnings.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_removes_whitespace_only_manifest_diff_lists_and_empty_relationships()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ManifestDiff = new ManifestDiffResult
            {
                LeftManifestVersion = "  v1  ",
                RightManifestVersion = "   ",
                AddedServices = ["   ", "  svc-a  "],
                Warnings = ["\t"],
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "   ", TargetId = " ", RelationshipType = "\t" },
                    new RelationshipDiffItem
                    {
                        SourceId = "  src  ",
                        TargetId = "  tgt  ",
                        RelationshipType = "  connects_to  ",
                        Description = "  edge note  ",
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ManifestDiff!.LeftManifestVersion.Should().Be("v1");
        report.ManifestDiff.RightManifestVersion.Should().BeEmpty();
        report.ManifestDiff.AddedServices.Should().Equal(["svc-a"]);
        report.ManifestDiff.Warnings.Should().BeEmpty();
        report.ManifestDiff.AddedRelationships.Should().ContainSingle();
        RelationshipDiffItem relationship = report.ManifestDiff.AddedRelationships[0];
        relationship.SourceId.Should().Be("src");
        relationship.TargetId.Should().Be("tgt");
        relationship.RelationshipType.Should().Be("connects_to");
        relationship.Description.Should().Be("edge note");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_trims_finding_correlation_metadata_strings()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = "   ",
                HonestyNote = "  fuzzy matches are advisory  ",
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingCorrelation!.PrimaryCorrelationMethod.Should().Be("PolicyRuleAndFingerprint");
        report.FindingCorrelation.HonestyNote.Should().Be("fuzzy matches are advisory");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clamps_negative_finding_correlation_match_counts()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PolicyRuleMatchCount = -2,
                FuzzyMatchCount = -1,
                UnmatchedLeftCount = 3,
                UnmatchedRightCount = -4,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingCorrelation!.PolicyRuleMatchCount.Should().Be(0);
        report.FindingCorrelation.FuzzyMatchCount.Should().Be(0);
        report.FindingCorrelation.UnmatchedLeftCount.Should().Be(3);
        report.FindingCorrelation.UnmatchedRightCount.Should().Be(0);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_trims_finding_lifecycle_records_and_re_summarizes_honesty()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                NewlyIdentifiedCount = 1,
                HonestyNote = "   ",
            },
            FindingLifecycleRecords =
            [
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.NewlyIdentified,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Cost,
                    Category = "  cost  ",
                    Message = "  spend drift  ",
                    PriorFindingId = "   ",
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        CrossReviewFindingLifecycleRecord record = report.FindingLifecycleRecords[0];
        record.Category.Should().Be("cost");
        record.Message.Should().Be("spend drift");
        record.PriorFindingId.Should().BeNull();
        report.FindingLifecycle!.HonestyNote.Should().NotBeNullOrWhiteSpace();
        report.FindingLifecycle.NewlyIdentifiedCount.Should().Be(1);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clamps_negative_finding_lifecycle_summary_counts()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                NewlyIdentifiedCount = -2,
                PreviouslyIdentifiedStillPresentCount = 1,
                ConfirmedResolvedCount = -1,
                UnverifiedResolvedCount = -3,
                AbsenceNotInformativeCount = 0,
                HonestyNote = "counts are illustrative",
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingLifecycle!.NewlyIdentifiedCount.Should().Be(0);
        report.FindingLifecycle.PreviouslyIdentifiedStillPresentCount.Should().Be(1);
        report.FindingLifecycle.ConfirmedResolvedCount.Should().Be(0);
        report.FindingLifecycle.UnverifiedResolvedCount.Should().Be(0);
        report.FindingLifecycle.AbsenceNotInformativeCount.Should().Be(0);
        report.FindingLifecycle.HonestyNote.Should().Be("counts are illustrative");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_trims_nested_compare_input_fingerprints()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            AgentResultDiff = new AgentResultDiffResult
            {
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                InputFingerprints = new CompareInputFingerprints
                {
                    ComparisonAlgorithmVersion = "   ",
                    BaseManifestHashSha256 = "  abcdef  ",
                    TargetManifestHashSha256 = "\t",
                },
            },
            ManifestDiff = new ManifestDiffResult
            {
                InputFingerprints = new CompareInputFingerprints
                {
                    BaseCommittedArtifactInventoryHashSha256 = "  inv1  ",
                    TargetCommittedArtifactInventoryHashSha256 = "   ",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff!.InputFingerprints!.ComparisonAlgorithmVersion
            .Should().Be(CompareInputFingerprints.AlgorithmVersion);
        report.AgentResultDiff.InputFingerprints.BaseManifestHashSha256.Should().Be("abcdef");
        report.AgentResultDiff.InputFingerprints.TargetManifestHashSha256.Should().BeNull();
        report.ManifestDiff!.InputFingerprints!.BaseCommittedArtifactInventoryHashSha256.Should().Be("inv1");
        report.ManifestDiff.InputFingerprints.TargetCommittedArtifactInventoryHashSha256.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clamps_negative_compare_quality_delta_counts()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareQualityDelta = new CompareQualityDeltaCounts
            {
                UnsupportedAssumptionsBefore = -3,
                HighSeverityAfter = -1,
                EvidenceBackedDecisionsBefore = 2,
                EvidenceBackedDecisionsAfter = 4,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareQualityDelta!.UnsupportedAssumptionsBefore.Should().Be(0);
        report.CompareQualityDelta.HighSeverityAfter.Should().Be(0);
        report.CompareQualityDelta.EvidenceBackedDecisionsBefore.Should().Be(2);
        report.CompareQualityDelta.EvidenceBackedDecisionsAfter.Should().Be(4);
    }
}
