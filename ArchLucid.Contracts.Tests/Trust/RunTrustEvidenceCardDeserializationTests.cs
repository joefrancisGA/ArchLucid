using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Trust;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Trust;

[Trait("Category", "Unit")]
public sealed class RunTrustEvidenceCardDeserializationTests
{
    [Fact]
    public void Deserialize_null_links_yields_empty_list_not_null()
    {
        const string json = """
            {
              "links": null
            }
            """;

        RunTrustEvidenceCard? card =
            JsonSerializer.Deserialize<RunTrustEvidenceCard>(json, ContractJson.CamelCaseCompact);

        card.Should().NotBeNull();
        card!.Links.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_field_snapshots_yields_non_null_snapshots_not_null()
    {
        const string json = """
            {
              "executionMode": null,
              "goldenManifest": null,
              "auditTrail": null,
              "agentTraces": null,
              "artifactBundlePointer": null,
              "traceabilityExport": null,
              "aiExplainability": null
            }
            """;

        RunTrustEvidenceCard? card =
            JsonSerializer.Deserialize<RunTrustEvidenceCard>(json, ContractJson.CamelCaseCompact);

        card.Should().NotBeNull();
        card!.ExecutionMode.Should().NotBeNull();
        card.GoldenManifest.Should().NotBeNull();
        card.AuditTrail.Should().NotBeNull();
        card.AgentTraces.Should().NotBeNull();
        card.ArtifactBundlePointer.Should().NotBeNull();
        card.TraceabilityExport.Should().NotBeNull();
        card.AiExplainability.Should().NotBeNull();
    }
}
