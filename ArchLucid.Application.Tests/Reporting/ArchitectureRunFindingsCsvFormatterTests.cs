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
        ArchitectureRunDetail detail = new();

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Be(ArchitectureRunFindingsCsvFormatter.HeaderLine + "\n");
        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(0);
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

        csv.Should().Contain("f-1,r-9,t-2,Compliance,Warning,cat,");
        csv.Should().Contain(",muted,noise,0.5,,,");
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
            "f-itsm,r-1,t-1,Compliance,Critical,security,Rotate keys,,active,,,,,"
            + "Jira,SEC-42,https://example.atlassian.net/browse/SEC-42,Pending,Deferred,"
            + revisit.ToString("O")
            + ",Jira:SEC-42; ServiceNow:INC001");
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
    public void FormatFindingStatus_maps_muted_and_active()
    {
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(true).Should().Be("muted");
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(false).Should().Be("active");
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
