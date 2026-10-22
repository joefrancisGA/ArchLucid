using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketDataConsistencyArtifactsTests
{
    [Fact]
    public void Data_consistency_summary_holds_when_run_not_committed()
    {
        const string deltas = """
            {
              "proofPackageCompleteness": {
                "runInCommittedStatus": false,
                "committedManifestPresent": false
              }
            }
            """;

        string json = PilotProofPacketDataConsistencyArtifacts.BuildSummaryJson("run-1", deltas);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("schema").GetString().Should().Be(PilotProofPacketArtifactCatalog.DataConsistencySummarySchema);
        root.GetProperty("disposition").GetString().Should().Be("HOLD");
        root.GetProperty("sponsorHandoffBlocked").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public void Audit_evidence_summary_markdown_includes_disposition_and_sample_ids()
    {
        const string deltas = """{"auditRowCount": 3, "auditRowCountTruncated": false}""";

        string markdown = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryMarkdown(
            "run-abc",
            ["evt-1", "evt-2"],
            deltas);

        markdown.Should().Contain("# Audit evidence summary");
        markdown.Should().Contain("**Disposition:** **PASS**");
        markdown.Should().Contain("`evt-1`");
    }

    [Fact]
    public void Commercial_readiness_holds_when_stale_extractor_and_savings()
    {
        const string deltas = """
            {
              "estimatedUsdSavings": 1200,
              "extractorCollectionTimestampUtc": "2026-01-01T00:00:00Z",
              "roiMetricSources": [
                { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
              ],
              "proofPackageCompleteness": { "runInCommittedStatus": true }
            }
            """;

        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-1", deltas, demoWarning: false, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
        doc.RootElement.GetProperty("roiFreshnessDisposition").GetString().Should().Be("HOLD");
    }

    [Fact]
    public void Commercial_readiness_holds_when_data_consistency_holds()
    {
        const string deltas = """
            {
              "estimatedUsdSavings": 1200,
              "proofPackageCompleteness": {
                "runInCommittedStatus": false
              }
            }
            """;

        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-1", deltas, demoWarning: false, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
        doc.RootElement.GetProperty("dataConsistencyDisposition").GetString().Should().Be("HOLD");
    }
}
