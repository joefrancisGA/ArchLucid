using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>RC30 package-coverage batch: merge input gate, schema serializers, and passthrough schema async paths.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisioningPackageCoverageBatchRc30Tests
{
    [Fact]
    public void DecisionMergeInputGate_TryValidateMergeInputs_rejects_blank_run_and_manifest()
    {
        DecisionMergeInputGate gate = new(new PassthroughSchemaValidationService());
        DecisionMergeResult output = new();

        gate.TryValidateMergeInputs("", "v1", [], output).Should().BeFalse();
        output.Errors.Should().Contain("RunId is required.");

        output.Errors.Clear();
        gate.TryValidateMergeInputs("run-1", "   ", [], output).Should().BeFalse();
        output.Errors.Should().Contain("Manifest version is required.");
    }

    [Fact]
    public void DecisionMergeInputGate_TryValidateMergeInputs_rejects_empty_results_collection()
    {
        DecisionMergeInputGate gate = new(new PassthroughSchemaValidationService());
        DecisionMergeResult output = new();

        gate.TryValidateMergeInputs("run-1", "v1", [], output).Should().BeFalse();
        output.Errors.Should().Contain("At least one agent result is required.");
    }

    [Fact]
    public void DecisionMergeInputGate_ValidateAndFilterResults_collects_per_result_validation_errors()
    {
        DecisionMergeInputGate gate = new(new PassthroughSchemaValidationService());
        DecisionMergeResult output = new();
        AgentResult mismatchedRun = ValidAgentResult(runId: "other-run");
        AgentResult invalidConfidence = ValidAgentResult();
        invalidConfidence.Confidence = 1.5;

        List<AgentResult> valid = gate.ValidateAndFilterResults(
            "run-1",
            [mismatchedRun, invalidConfidence, ValidAgentResult()],
            output);

        valid.Should().ContainSingle();
        output.Errors.Should().Contain(e => e.Contains("does not match the merge run", StringComparison.Ordinal));
        output.Errors.Should().Contain(e => e.Contains("Confidence must be between 0 and 1", StringComparison.Ordinal));
    }

    [Fact]
    public void DecisionMergeInputGate_ValidateAgentResultsAgainstSchema_maps_schema_errors()
    {
        Mock<ISchemaValidationService> schema = new();
        schema
            .Setup(s => s.ValidateAgentResultJson(It.IsAny<string>()))
            .Returns(new SchemaValidationResult { Errors = ["invalid topology payload"] });

        DecisionMergeInputGate gate = new(schema.Object);
        DecisionMergeResult output = new();
        List<AgentResult> results = [ValidAgentResult()];

        gate.ValidateAgentResultsAgainstSchema(results, output).Should().BeFalse();
        output.Errors.Should().Contain(e => e.Contains("invalid topology payload", StringComparison.Ordinal));
    }

    [Fact]
    public void SchemaValidationSerializer_serializes_enums_as_strings()
    {
        SampleEnumPayload payload = new() { AgentType = AgentType.Topology };

        string json = SchemaValidationSerializer.Serialize(payload);

        json.Should().Contain("\"Topology\"");
        json.Should().NotContain("\"agentType\":1");
    }

    [Fact]
    public void AgentResultMergeSchemaSerializer_serializes_normalized_agent_result()
    {
        AgentResult result = ValidAgentResult();
        result.Claims = ["ingress must use private endpoints"];

        string json = AgentResultMergeSchemaSerializer.Serialize(result);

        json.Should().Contain("ingress must use private endpoints");
        json.Should().Contain("run-1");
    }

    [Fact]
    public async Task PassthroughSchemaValidationService_remaining_validators_return_valid_results()
    {
        PassthroughSchemaValidationService service = new();

        service.ValidateExplanationRunJson("{}").IsValid.Should().BeTrue();
        service.ValidateComparisonExplanationJson("{}").IsValid.Should().BeTrue();
        (await service.ValidateAgentResultJsonAsync("{}")).IsValid.Should().BeTrue();
        (await service.ValidateGoldenManifestJsonAsync("{}")).IsValid.Should().BeTrue();
    }

    private static AgentResult ValidAgentResult(string runId = "run-1")
    {
        return new AgentResult
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0.82,
            Claims = ["claim"],
        };
    }

    private sealed class SampleEnumPayload
    {
        public AgentType AgentType
        {
            get;
            set;
        }
    }
}
