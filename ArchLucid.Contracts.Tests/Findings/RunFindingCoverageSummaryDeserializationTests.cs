using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class RunFindingCoverageSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_failed_engine_labels_yields_empty_list_not_null()
    {
        const string json = """
            {
              "enginesAttempted": 0,
              "enginesSucceeded": 0,
              "enginesFailed": 0,
              "isDegraded": false,
              "hasCommitBlockingFailures": false,
              "failedEngineLabels": null,
              "generationStatus": 2
            }
            """;

        RunFindingCoverageSummary? summary =
            JsonSerializer.Deserialize<RunFindingCoverageSummary>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.FailedEngineLabels.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_omitted_generation_status_does_not_claim_complete()
    {
        const string json = """
            {
              "enginesAttempted": 0,
              "enginesSucceeded": 0,
              "enginesFailed": 0,
              "isDegraded": false,
              "hasCommitBlockingFailures": false
            }
            """;

        RunFindingCoverageSummary? summary =
            JsonSerializer.Deserialize<RunFindingCoverageSummary>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Generating);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2147483647)]
    [InlineData(-1)]
    public void Deserialize_explicit_invalid_generation_status_is_rejected(int raw)
    {
        string json = "{\"generationStatus\":" + raw.ToString(System.Globalization.CultureInfo.InvariantCulture) + "}";
        Action read = () => JsonSerializer.Deserialize<RunFindingCoverageSummary>(json, ContractJson.CamelCaseCompact);
        read.Should().Throw<JsonException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2147483647)]
    public void Explicit_invalid_lifecycle_state_never_becomes_success(int raw)
    {
        Action snapshot = () => JsonSerializer.Deserialize<FindingsSnapshot>("{\"generationStatus\":" + raw + "}", ContractJson.CamelCaseCompact);
        Action bundle = () => JsonSerializer.Deserialize<ArchLucid.Contracts.Persistence.Artifacts.ArtifactBundle>("{\"status\":" + raw + "}", ContractJson.CamelCaseCompact);
        Action artifact = () => JsonSerializer.Deserialize<ArchLucid.Contracts.Persistence.Artifacts.SynthesizedArtifact>("{\"status\":" + raw + "}", ContractJson.CamelCaseCompact);
        snapshot.Should().Throw<JsonException>();
        bundle.Should().Throw<JsonException>();
        artifact.Should().Throw<JsonException>();
    }
}
