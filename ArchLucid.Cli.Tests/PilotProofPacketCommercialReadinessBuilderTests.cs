using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketCommercialReadinessBuilderTests
{
    [Fact]
    public void BuildJson_unsourced_roi_dollar_claim_is_hold()
    {
        string deltas = """
            {
              "estimatedUsdSavings": 12000,
              "proofPackageCompleteness": {
                "agentOutputPilotStrictEvidenceSatisfied": true
              }
            }
            """;

        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-1", deltas, demoWarning: false, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
        root.GetProperty("roiBasisStatus").GetString().Should().Be("hold_missing_sources");
        root.GetProperty("sponsorHandoffRecommended").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public void BuildJson_classified_roi_sources_pass_when_other_gates_green()
    {
        string deltas = """
            {
              "roiMetricSources": [
                { "metricKey": "hours", "label": "Hours saved", "value": "4", "sourceKind": "TenantMeasured" }
              ],
              "proofPackageCompleteness": {
                "agentOutputPilotStrictEvidenceSatisfied": true
              }
            }
            """;

        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-1", deltas, demoWarning: false, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("proofDisposition").GetString().Should().Be("READY");
        root.GetProperty("roiBasisStatus").GetString().Should().Be("classified");
        root.GetProperty("sponsorHandoffRecommended").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public void BuildJson_demo_warning_forces_hold()
    {
        string deltas = "{}";

        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-1", deltas, demoWarning: true, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
    }
}
