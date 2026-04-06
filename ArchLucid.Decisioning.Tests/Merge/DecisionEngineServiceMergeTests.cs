using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Decision Engine Service Merge.
/// </summary>

[Trait("Category", "Unit")]
public sealed class DecisionEngineServiceMergeTests
{
    [Fact]
    public void MergeResults_BlankRunId_ReturnsError()
    {
        DecisionEngineService sut = new(new PassthroughSchemaValidationService());
        ArchitectureRequest request = MinimalRequest();

        DecisionMergeResult result = sut.MergeResults(
            "",
            request,
            "v1",
            [ValidResult("run-1")],
            [],
            []);

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("RunId", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void MergeResults_BlankManifestVersion_ReturnsError()
    {
        DecisionEngineService sut = new(new PassthroughSchemaValidationService());
        ArchitectureRequest request = MinimalRequest();

        DecisionMergeResult result = sut.MergeResults(
            "run-1",
            request,
            "  ",
            [ValidResult("run-1")],
            [],
            []);

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("Manifest version", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void MergeResults_NoResults_ReturnsError()
    {
        DecisionEngineService sut = new(new PassthroughSchemaValidationService());
        ArchitectureRequest request = MinimalRequest();

        DecisionMergeResult result = sut.MergeResults(
            "run-1",
            request,
            "v1",
            [],
            [],
            []);

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("At least one agent result", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void MergeResults_SchemaInvalid_ReturnsErrorWithResultId()
    {
        Mock<ISchemaValidationService> schema = new();
        schema.Setup(x => x.ValidateAgentResultJson(It.IsAny<string>()))
            .Returns(new SchemaValidationResult { Errors = ["type mismatch"] });
        schema.Setup(x => x.ValidateGoldenManifestJson(It.IsAny<string>()))
            .Returns(new SchemaValidationResult());

        DecisionEngineService sut = new(schema.Object);
        ArchitectureRequest request = MinimalRequest();
        AgentResult bad = ValidResult("run-1");
        bad.ResultId = "bad-result-id";

        DecisionMergeResult result = sut.MergeResults(
            "run-1",
            request,
            "v1",
            [bad],
            [],
            []);

        result.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("bad-result-id", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void MergeResults_ValidMinimalPath_ReturnsManifest()
    {
        DecisionEngineService sut = new(new PassthroughSchemaValidationService());
        ArchitectureRequest request = MinimalRequest();

        DecisionMergeResult result = sut.MergeResults(
            "run-1",
            request,
            "v1",
            [ValidResult("run-1")],
            [],
            []);

        result.Success.Should().BeTrue();
        result.Errors.Should().BeEmpty();
        result.Manifest.RunId.Should().Be("run-1");
    }

    private static ArchitectureRequest MinimalRequest() =>
        new()
        {
            RequestId = "req-1",
            SystemName = "Sys",
            Description = "A long enough description for validation.",
            Environment = "prod"
        };

    private static AgentResult ValidResult(string runId) =>
        new()
        {
            ResultId = "res-1",
            TaskId = "task-1",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0.9,
            Claims = ["ok"],
            EvidenceRefs = ["e1"]
        };
}
