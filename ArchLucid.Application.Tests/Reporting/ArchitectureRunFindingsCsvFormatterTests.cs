using System.Reflection;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunFindingsCsvFormatterTests
{
    [Fact]
    public void BuildCsvContent_with_no_results_emits_header_only()
    {
        ArchitectureRunDetail detail = new() { Results = [] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.NoChecklistCoverageRowsOmittedLine);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.NoDecisionGradeFindingsReviewerLine);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.HeaderLine);
        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(0);
    }

    [Fact]
    public void BuildCsvContent_with_null_results_emits_findings_not_stored_line()
    {
        ArchitectureRunDetail detail = new();
        FieldInfo? resultsField = typeof(ArchitectureRunDetail).GetField(
            "results",
            BindingFlags.Instance | BindingFlags.NonPublic);
        resultsField.Should().NotBeNull();
        resultsField!.SetValue(detail, null);

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().StartWith(ArchitectureRunFindingsCsvFormatter.FindingsNotStoredReviewerLine);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.HeaderLine);
    }

    [Fact]
    public void FormatSeverityForExport_pairs_stored_enum_with_reviewer_label()
    {
        ArchitectureRunFindingsCsvFormatter.FormatSeverityForExport(FindingSeverity.Error)
            .Should()
            .Be("Stored severity: Error. Reviewer label: Error.");
    }

    [Fact]
    public void FormatSeverityForExport_uses_workspace_severity_labels_not_legacy_high_medium_low()
    {
        ArchitectureRunFindingsCsvFormatter.FormatSeverityForExport(FindingSeverity.Warning)
            .Should()
            .Be("Stored severity: Warning. Reviewer label: Warning.");
        ArchitectureRunFindingsCsvFormatter.FormatSeverityForExport(FindingSeverity.Info)
            .Should()
            .Be("Stored severity: Info. Reviewer label: Info.");
    }

    [Fact]
    public void BuildCsvContent_exports_evaluation_confidence_when_agent_confidence_is_absent()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-eval",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg",
            EvaluationConfidenceScore = 88,
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain("Evaluation confidence score: 88");
    }

    [Fact]
    public void BuildCsvContent_distinguishes_missing_itsm_row_from_empty_provider_when_enrichment_loaded()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-no-track",
            Severity = FindingSeverity.Info,
            Category = "cat",
            Message = "msg",
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(
            new ArchitectureRunDetail { Results = [result] },
            trackingByFindingId: new Dictionary<string, RunFindingExternalTrackingProjection>(StringComparer.Ordinal));

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.NoItsmTrackingRowStoredLabel);
        csv.Should().NotContain("ITSM provider was not stored.");
    }

    [Fact]
    public void BuildCsvContent_flattens_findings_and_escapes_special_characters()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-1",
            SourceAgent = AgentType.Compliance,
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "Say \"hello\", line1\nline2",
            IsMuted = true,
            MuteReason = "noise",
            ConfidenceScore = 0.5
        };

        AgentResult result = new()
        {
            ResultId = "r-9",
            TaskId = "t-2",
            AgentType = AgentType.Compliance,
            Findings = [finding]
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain("f-1,r-9,t-2,Compliance,Stored severity: Warning. Reviewer label: Warning.,cat,");
        csv.Should().Contain(",muted,noise,0.5,Trust label was not stored.,Trust label reason was not stored.,");
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.TrustLabelHeaderSuffix);

        string escapedMessage = ExportFormatterService.EscapeCsvField(finding.Message);
        csv.Should().Contain(escapedMessage);

        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(1);
    }

    [Fact]
    public void BuildCsvContent_appends_external_tracking_columns_when_enrichment_exists()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-itsm",
            Severity = FindingSeverity.Critical,
            Category = "security",
            Message = "Rotate keys"
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding]
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        DateTimeOffset revisit = new DateTimeOffset(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

        Dictionary<string, RunFindingExternalTrackingProjection> tracking = new(StringComparer.Ordinal)
        {
            ["f-itsm"] = new RunFindingExternalTrackingProjection
            {
                Provider = "Jira",
                ExternalKey = "SEC-42",
                ExternalUrl = "https://example.atlassian.net/browse/SEC-42",
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                LatestDisposition = FindingDisposition.Deferred,
                RevisitDueUtc = revisit,
                ItsmLinkedTicketsSummary = "Jira:SEC-42; ServiceNow:INC001"
            }
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail, tracking);

        csv.Should().Contain(
            "f-itsm,r-1,t-1,Compliance,Stored severity: Critical. Reviewer label: Critical.,security,Rotate keys,Estimated savings were not stored.,"
            + ArchitectureRunFindingsCsvFormatter.FindingNotMutedStatusLabel
            + ","
            + ArchitectureRunFindingsCsvFormatter.MuteReasonNotApplicableLabel
            + ","
            + "Confidence score was not stored.,Trust label was not stored.,Trust label reason was not stored.,"
            + "Jira,SEC-42,https://example.atlassian.net/browse/SEC-42,Pending,Deferred,"
            + revisit.ToString("O")
            + ",Jira:SEC-42; ServiceNow:INC001");
    }

    [Fact]
    public void BuildCsvContent_when_tracking_enrichment_loaded_but_row_missing_uses_no_row_label_for_itsm_fields()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-no-row",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg"
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding]
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        Dictionary<string, RunFindingExternalTrackingProjection> tracking = new(StringComparer.Ordinal);

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail, tracking);

        string noRow = ArchitectureRunFindingsCsvFormatter.NoItsmTrackingRowStoredLabel;
        csv.Should().Contain(
            $"Trust label reason was not stored.,{noRow},{noRow},{noRow},");
        csv.Should().Contain($",{noRow}");
    }

    [Fact]
    public void BuildCsvContent_when_tracking_row_exists_but_provider_blank_uses_provider_not_stored()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-blank-provider",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg"
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding]
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        Dictionary<string, RunFindingExternalTrackingProjection> tracking = new(StringComparer.Ordinal)
        {
            ["f-blank-provider"] = new RunFindingExternalTrackingProjection
            {
                Provider = "   ",
                ExternalKey = "KEY-1",
                ExternalUrl = "https://example.test/KEY-1",
                ItsmLinkedTicketsSummary = "KEY-1"
            }
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail, tracking);

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.ExternalProviderNotStoredLabel);
        csv.Should().Contain("KEY-1,https://example.test/KEY-1");
        csv.Should().NotContain(ArchitectureRunFindingsCsvFormatter.NoItsmTrackingRowStoredLabel);
    }

    [Fact]
    public void BuildCsvContent_emits_trust_label_columns_when_enriched()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-trust",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "Rule hit",
            PolicyRuleId = "rule-1",
            TrustLabel = nameof(FindingTrustLabel.DeterministicRule),
            TrustLabelReason = "A deterministic policy rule fired; rationale comes from the rule definition.",
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain("DeterministicRule");
        csv.Should().Contain("deterministic policy rule fired");
    }

    [Fact]
    public void BuildCsvContent_blank_finding_id_uses_stored_empty_whitespace_result_id_not_stored()
    {
        AgentResult result = new()
        {
            ResultId = "  ",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "",
                    Severity = FindingSeverity.Warning,
                    Category = "security",
                    Message = "Rotate keys",
                },
            ],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.FindingIdStoredEmptyLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.ResultIdStoredEmptyLabel);
    }

    [Fact]
    public void BuildCsvContent_omits_checklist_coverage_rows()
    {
        ArchitectureFinding decisionGrade = new()
        {
            FindingId = "f-decision",
            Severity = FindingSeverity.Warning,
            Category = "security",
            Message = "Rotate keys",
            Classification = FindingClassification.DecisionGradeFinding,
        };

        ArchitectureFinding checklist = new()
        {
            FindingId = "f-checklist",
            Severity = FindingSeverity.Info,
            Category = "hygiene",
            Message = "Generic hygiene note",
            Classification = FindingClassification.ChecklistCoverage,
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [decisionGrade, checklist],
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain("f-decision");
        csv.Should().NotContain("f-checklist");
        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(1);
        ArchitectureRunFindingsCsvFormatter.CountOmittedChecklistCoverageFindingsInDetail(detail).Should().Be(1);
        ArchitectureRunFindingsCsvFormatter.CollectFindingIds(detail).Should().BeEquivalentTo(["f-decision"]);
        csv.Should().Contain($"{ArchitectureRunFindingsCsvFormatter.ChecklistCoverageRowsOmittedLinePrefix} 1");
    }

    [Fact]
    public void BuildCsvContent_states_when_no_checklist_rows_were_omitted()
    {
        ArchitectureRunDetail detail = new() { Results = [] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.NoChecklistCoverageRowsOmittedLine);
    }

    [Fact]
    public void FormatFindingStatus_maps_muted_and_not_muted()
    {
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(true).Should().Be("muted");
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(false)
            .Should()
            .Be(ArchitectureRunFindingsCsvFormatter.FindingNotMutedStatusLabel);
    }

    [Fact]
    public void BuildCsvContent_when_agent_result_findings_list_is_null_emits_findings_list_not_stored_line()
    {
        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
        };

        FieldInfo? findingsField = typeof(AgentResult).GetField(
            "findings",
            BindingFlags.Instance | BindingFlags.NonPublic);
        findingsField.Should().NotBeNull();
        findingsField!.SetValue(result, null);

        ArchitectureRunDetail detail = new() { Results = [result] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.AgentResultFindingsListNotStoredReviewerLine);
        csv.Should().NotContain(ArchitectureRunFindingsCsvFormatter.NoDecisionGradeFindingsReviewerLine);
    }

    [Fact]
    public void BuildCsvContent_labels_omitted_scalar_fields_as_not_stored()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-honest",
            Severity = FindingSeverity.Warning,
        };
        finding.Category = null!;
        finding.Message = null!;
        finding.TrustLabel = null!;
        finding.TrustLabelReason = null!;

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.CategoryNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.FindingMessageNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.TrustLabelNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.TrustLabelReasonNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.ConfidenceScoreNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.EstimatedSavingsNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.HumanReviewStatusNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.DispositionNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.RevisitTimeNotStoredLabel);
    }

    [Fact]
    public void BuildCsvContent_prefixes_stored_estimated_usd_savings()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-savings",
            Severity = FindingSeverity.Warning,
            Category = "cost",
            Message = "msg",
            EstimatedUsdSavings = 1250.5m,
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(
            ArchitectureRunFindingsCsvFormatter.EstimatedUsdSavingsExportPrefix + "1250.5");
    }

    [Fact]
    public void BuildCsvContent_labels_muted_findings_without_mute_reason()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-muted",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg",
            IsMuted = true,
        };

        AgentResult result = new()
        {
            ResultId = "r-1",
            TaskId = "t-1",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.MuteReasonNotStoredLabel);
    }

    [Fact]
    public void BuildCsvContent_labels_missing_result_and_task_ids()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-ids",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg",
        };

        AgentResult result = new()
        {
            ResultId = "",
            TaskId = " ",
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.ResultIdStoredEmptyLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.TaskIdStoredEmptyLabel);
    }

    [Fact]
    public void BuildCsvContent_null_result_and_task_ids_use_not_stored_labels()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-ids",
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "msg",
        };

        AgentResult result = new()
        {
            AgentType = AgentType.Compliance,
            Findings = [finding],
        };

        result.ResultId = null!;
        result.TaskId = null!;

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(new ArchitectureRunDetail { Results = [result] });

        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.ResultIdNotStoredLabel);
        csv.Should().Contain(ArchitectureRunFindingsCsvFormatter.TaskIdNotStoredLabel);
    }

    [Fact]
    public void CollectFindingIds_returns_distinct_ids()
    {
        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding { FindingId = "a" },
                        new ArchitectureFinding { FindingId = "b" }
                    ]
                },
                new AgentResult
                {
                    Findings = [new ArchitectureFinding { FindingId = "a" }]
                }
            ]
        };

        ArchitectureRunFindingsCsvFormatter.CollectFindingIds(detail).Should().BeEquivalentTo(["a", "b"]);
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingExternalTrackingEnrichmentServiceTests
{
    [Fact]
    public async Task LoadForFindingsAsync_maps_rows_and_builds_external_url()
    {
        Mock<IRunFindingExternalTrackingReadRepository> readRepository = new();

        readRepository
            .Setup(repo => repo.ListForFindingsAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, RunFindingExternalTrackingReadRow>(StringComparer.Ordinal)
            {
                ["finding-1"] = new RunFindingExternalTrackingReadRow
                {
                    FindingId = "finding-1",
                    HumanReviewStatus = "Pending",
                    Disposition = "Deferred",
                    RevisitDueUtc = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    Provider = "Jira",
                    ExternalKey = "ABC-1",
                    ExternalSysId = "sys-1",
                    ItsmLinkedTicketsSummary = "Jira:ABC-1"
                }
            });

        RunFindingExternalTrackingEnrichmentService sut = new(
            readRepository.Object,
            UrlBuilder(new IntegrationsItsmOutboundOptions
            {
                Jira = new JiraItsmOutboundOptions { CloudBaseUrl = "https://example.atlassian.net" }
            }));

        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> result =
            await sut.LoadForFindingsAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                findingsSnapshotId: null,
                ["finding-1"],
                CancellationToken.None);

        RunFindingExternalTrackingProjection projection = result["finding-1"];
        projection.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Pending);
        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
        projection.ExternalUrl.Should().Be("https://example.atlassian.net/browse/ABC-1");
        projection.TrackedExternally.Should().BeTrue();
        projection.ExternalTrackingSummary.Should().Be("Jira:ABC-1");
    }
}

internal static class OptionsMonitorTestExtensions
{
    public static IOptionsMonitor<T> ToMonitor<T>(this IOptions<T> options) where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options.Value);
        return monitor.Object;
    }
}
