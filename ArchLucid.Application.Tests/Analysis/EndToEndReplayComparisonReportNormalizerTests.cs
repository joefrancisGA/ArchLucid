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
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_backfills_nested_agent_and_export_diff_run_ids_from_report_anchors()
    {
        const string leftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string rightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            AgentResultDiff = new AgentResultDiffResult
            {
                LeftRunId = "   ",
                RightRunId = "\t",
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["spend drift"],
                    },
                ],
            },
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftRunId = " ",
                    RightRunId = "  ",
                    ChangedTopLevelFields = ["Format"],
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff!.LeftRunId.Should().Be(leftRunId);
        report.AgentResultDiff.RightRunId.Should().Be(rightRunId);
        report.ExportDiffs[0].LeftRunId.Should().Be(leftRunId);
        report.ExportDiffs[0].RightRunId.Should().Be(rightRunId);
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
        report.CompareVerdictChromeDelta.GateOutcome.Changed.Should().BeTrue();
        report.CompareVerdictChromeDelta.PackAssignment.Changed.Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_syncs_verdict_chrome_changed_flags_from_normalized_labels()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                GateOutcome = new CompareVerdictChromeGateOutcomeDelta
                {
                    BaselineGateLabel = "Gate pending",
                    TargetGateLabel = "  Gate pending  ",
                    Changed = true,
                },
                ExecutionMode = new CompareVerdictChromeExecutionModeDelta
                {
                    BaselineModeLabel = "Real",
                    TargetModeLabel = "  Real  ",
                    Changed = true,
                    AdvisoryParagraph = "stale advisory",
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.GateOutcome!.Changed.Should().BeFalse();
        report.CompareVerdictChromeDelta.ExecutionMode!.Changed.Should().BeFalse();
        report.CompareVerdictChromeDelta.ExecutionMode.AdvisoryParagraph.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_pack_assignment_when_both_sides_are_no_pack_recorded()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CompareVerdictChromeDelta = new CompareVerdictChromeDelta
            {
                GateOutcome = new CompareVerdictChromeGateOutcomeDelta
                {
                    BaselineGateLabel = "Soft infeasible",
                    TargetGateLabel = "Gate pending",
                    Changed = true,
                },
                PackAssignment = new CompareVerdictChromePackAssignmentDelta
                {
                    BaselineSummaryLine = "   ",
                    TargetSummaryLine = "\t",
                    Changed = true,
                },
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.CompareVerdictChromeDelta!.PackAssignment.Should().BeNull();
        report.CompareVerdictChromeDelta.GateOutcome.Should().NotBeNull();
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
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_run_metadata_changed_fields()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["Status", "  Status  ", "RequestId", "Status"],
                StatusDiffers = false,
                RequestIdsDiffer = false,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.RunDiff.ChangedFields.Should().Equal(["Status", "RequestId"]);
        report.RunDiff.StatusDiffers.Should().BeTrue();
        report.RunDiff.RequestIdsDiffer.Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_duplicate_top_level_warnings_and_interpretation_notes()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Warnings = ["partial coverage", "  partial coverage  ", "drift"],
            InterpretationNotes = ["note-a", "note-a", "  note-b  "],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.Warnings.Should().Equal(["partial coverage", "drift"]);
        report.InterpretationNotes.Should().Equal(["note-a", "note-b"]);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_run_metadata_flags_when_changed_fields_empty()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["   ", "\t"],
                RequestIdsDiffer = true,
                StatusDiffers = true,
                ManifestVersionsDiffer = true,
                ExecutionModesDiffer = true,
                SharedNonRealExecutionMode = true,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.RunDiff.ChangedFields.Should().BeEmpty();
        report.RunDiff.RequestIdsDiffer.Should().BeFalse();
        report.RunDiff.StatusDiffers.Should().BeFalse();
        report.RunDiff.ManifestVersionsDiffer.Should().BeFalse();
        report.RunDiff.ExecutionModesDiffer.Should().BeFalse();
        report.RunDiff.SharedNonRealExecutionMode.Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_syncs_run_metadata_diff_flags_from_changed_field_names()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["Status", "CurrentManifestVersion"],
                RequestIdsDiffer = true,
                StatusDiffers = false,
                ManifestVersionsDiffer = false,
                SharedNonRealExecutionMode = true,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.RunDiff.RequestIdsDiffer.Should().BeFalse();
        report.RunDiff.StatusDiffers.Should().BeTrue();
        report.RunDiff.ManifestVersionsDiffer.Should().BeTrue();
        report.RunDiff.SharedNonRealExecutionMode.Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_shared_non_real_execution_mode_when_execution_mode_differs()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["StructuralExecutionMode"],
                SharedNonRealExecutionMode = true,
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.RunDiff.ExecutionModesDiffer.Should().BeTrue();
        report.RunDiff.SharedNonRealExecutionMode.Should().BeFalse();
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

        report.AgentResultDiff!.LeftRunId.Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        report.AgentResultDiff.RightRunId.Should().Be(rightRunGuid.ToString("N"));
        report.AgentResultDiff.Warnings.Should().Equal(["partial agent coverage"]);
        AgentResultDelta delta = report.AgentResultDiff.AgentDeltas[0];
        delta.AddedClaims.Should().Equal(["claim-a"]);
        delta.RemovedWarnings.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_drops_immaterial_agent_result_deltas()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["   "],
                        RemovedFindings = ["\t"],
                    },
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Topology,
                        LeftExists = true,
                        RightExists = false,
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff!.AgentDeltas.Should().ContainSingle();
        report.AgentResultDiff.AgentDeltas[0].AgentType.Should().Be(AgentType.Topology);
        report.AgentResultDiff.AgentDeltas[0].LeftExists.Should().BeTrue();
        report.AgentResultDiff.AgentDeltas[0].RightExists.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_duplicate_agent_result_deltas_by_agent_type()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["baseline claim"],
                    },
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["duplicate row"],
                    },
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Topology,
                        AddedFindings = ["drift"],
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff!.AgentDeltas.Should().HaveCount(2);
        report.AgentResultDiff.AgentDeltas[0].AgentType.Should().Be(AgentType.Cost);
        report.AgentResultDiff.AgentDeltas[0].AddedClaims.Should().Equal(["baseline claim"]);
        report.AgentResultDiff.AgentDeltas[1].AgentType.Should().Be(AgentType.Topology);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_drops_immaterial_export_record_diffs()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    Warnings = ["   "],
                    ChangedTopLevelFields = ["\t"],
                    RequestDiff = new ExportRecordRequestDiff
                    {
                        ChangedFlags = ["  "],
                        ChangedValues = ["   "],
                    },
                },
                new ExportRecordDiffResult
                {
                    ChangedTopLevelFields = ["Format"],
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ExportDiffs.Should().ContainSingle();
        report.ExportDiffs[0].ChangedTopLevelFields.Should().Equal(["Format"]);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_drops_export_diff_with_empty_nested_request_shells()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    RequestDiff = new ExportRecordRequestDiff
                    {
                        LeftRequest = new PersistedAnalysisExportRequest(),
                        RightRequest = new PersistedAnalysisExportRequest { Audience = "   " },
                    },
                },
                new ExportRecordDiffResult
                {
                    RequestDiff = new ExportRecordRequestDiff
                    {
                        LeftRequest = new PersistedAnalysisExportRequest { CompareManifestVersion = "v2" },
                    },
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ExportDiffs.Should().ContainSingle();
        report.ExportDiffs[0].RequestDiff.LeftRequest!.CompareManifestVersion.Should().Be("v2");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_duplicate_export_record_diffs_by_export_id_pair()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "left-export",
                    RightExportRecordId = "right-export",
                    ChangedTopLevelFields = ["Format"],
                },
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "left-export",
                    RightExportRecordId = "right-export",
                    ChangedTopLevelFields = ["FileName"],
                },
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "other-left",
                    RightExportRecordId = "other-right",
                    ChangedTopLevelFields = ["TemplateProfile"],
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ExportDiffs.Should().HaveCount(2);
        report.ExportDiffs[0].ChangedTopLevelFields.Should().Equal(["Format"]);
        report.ExportDiffs[1].ChangedTopLevelFields.Should().Equal(["TemplateProfile"]);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_immaterial_manifest_diff_shell()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ManifestDiff = new ManifestDiffResult
            {
                LeftManifestVersion = "   ",
                AddedServices = ["   "],
                Warnings = ["\t"],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ManifestDiff.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_empty_agent_result_diff_shell()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Cost,
                        AddedClaims = ["   "],
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.AgentResultDiff.Should().BeNull();
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
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_duplicate_manifest_relationship_diff_items()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem
                    {
                        SourceId = "src",
                        TargetId = "tgt",
                        RelationshipType = "connects_to",
                        Description = "first note",
                    },
                    new RelationshipDiffItem
                    {
                        SourceId = "  src  ",
                        TargetId = "  tgt  ",
                        RelationshipType = "  connects_to  ",
                        Description = "duplicate row",
                    },
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem
                    {
                        SourceId = "a",
                        TargetId = "b",
                        RelationshipType = "depends_on",
                    },
                    new RelationshipDiffItem
                    {
                        SourceId = "a",
                        TargetId = "b",
                        RelationshipType = "depends_on",
                    },
                ],
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.ManifestDiff!.AddedRelationships.Should().ContainSingle();
        report.ManifestDiff.AddedRelationships[0].Description.Should().Be("first note");
        report.ManifestDiff.RemovedRelationships.Should().ContainSingle();
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
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_empty_finding_correlation_metadata_shell()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = "   ",
                HonestyNote = "   ",
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingCorrelation.Should().BeNull();
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
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_nulls_empty_finding_lifecycle_summary_shell()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                HonestyNote = "   ",
            },
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingLifecycle.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_drops_display_empty_finding_lifecycle_records()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycleRecords =
            [
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.NewlyIdentified,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Cost,
                    Category = "   ",
                    Message = "\t",
                },
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Topology,
                    Category = "topology",
                    Message = "drift",
                    CurrentFindingId = "cccccccccccccccccccccccccccccccc",
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingLifecycleRecords.Should().ContainSingle();
        report.FindingLifecycleRecords[0].Category.Should().Be("topology");
        report.FindingLifecycle!.PreviouslyIdentifiedStillPresentCount.Should().Be(1);
        report.FindingLifecycle.NewlyIdentifiedCount.Should().Be(0);
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_dedupes_duplicate_finding_lifecycle_records()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycleRecords =
            [
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.NewlyIdentified,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Topology,
                    Category = "topology",
                    Message = "new gap",
                    CurrentFindingId = "cccccccccccccccccccccccccccccccc",
                },
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.NewlyIdentified,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Topology,
                    Category = "  topology  ",
                    Message = "  new gap  ",
                    CurrentFindingId = "  cccccccccccccccccccccccccccccccc  ",
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingLifecycleRecords.Should().ContainSingle();
        report.FindingLifecycle!.NewlyIdentifiedCount.Should().Be(1);
        report.FindingLifecycleRecords[0].CurrentFindingId.Should().Be("cccccccccccccccccccccccccccccccc");
    }

    [Fact]
    public void CompareQuality_EndToEndReplayComparisonReportNormalizer_clears_stale_finding_lifecycle_summary_when_all_records_normalize_away()
    {
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            FindingLifecycle = new CrossReviewFindingLifecycleSummary
            {
                NewlyIdentifiedCount = 9,
                PreviouslyIdentifiedStillPresentCount = 4,
                HonestyNote = "stale summary from corrupt JSON",
            },
            FindingLifecycleRecords =
            [
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.NewlyIdentified,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                    CorrelationMethod = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Topology,
                    Category = "   ",
                    Message = "\t",
                },
            ],
        };

        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);

        report.FindingLifecycleRecords.Should().BeEmpty();
        report.FindingLifecycle.Should().BeNull();
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
