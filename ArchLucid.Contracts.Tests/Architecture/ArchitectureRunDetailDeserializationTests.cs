using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunDetailDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "run": {
                "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "requestId": "req-1",
                "status": 1
              },
              "tasks": null,
              "results": null,
              "decisionTraces": null
            }
            """;

        ArchitectureRunDetail detail = JsonSerializer.Deserialize<ArchitectureRunDetail>(json, ContractJson.Default)!;

        detail.Tasks.Should().NotBeNull().And.BeEmpty();
        detail.Results.Should().NotBeNull().And.BeEmpty();
        detail.DecisionTraces.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_run_yields_non_null_run_not_null()
    {
        const string json = """
            {
              "run": null,
              "tasks": []
            }
            """;

        ArchitectureRunDetail? detail =
            JsonSerializer.Deserialize<ArchitectureRunDetail>(json, ContractJson.Default);

        detail.Should().NotBeNull();
        detail!.Run.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_manifest_remains_null()
    {
        const string json = """
            {
              "run": {
                "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "requestId": "req-1",
                "status": 1
              },
              "manifest": null
            }
            """;

        ArchitectureRunDetail? detail =
            JsonSerializer.Deserialize<ArchitectureRunDetail>(json, ContractJson.Default);

        detail.Should().NotBeNull();
        detail!.Manifest.Should().BeNull();
        detail.IsCommitted.Should().BeFalse();
    }

    [Fact]
    public void Deserialize_null_agent_execution_llm_cost_estimate_remains_null()
    {
        const string json = """
            {
              "run": {
                "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "requestId": "req-1",
                "status": 1
              },
              "agentExecutionLlmCostEstimate": null
            }
            """;

        ArchitectureRunDetail? detail =
            JsonSerializer.Deserialize<ArchitectureRunDetail>(json, ContractJson.Default);

        detail.Should().NotBeNull();
        detail!.AgentExecutionLlmCostEstimate.Should().BeNull();
    }
}
