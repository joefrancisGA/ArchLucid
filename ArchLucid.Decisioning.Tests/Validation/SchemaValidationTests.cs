using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Schema Validation.
/// </summary>
[Trait("Category", "Unit")]
public sealed class SchemaValidationTests
{
    [Fact]
    public void MergeResults_InvalidAgentResultSchema_FailsCommit()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "TestSystem",
            Description = "d"
        };

        AgentResult invalid = new()
        {
            ResultId = "RES-INVALID-001",
            TaskId = "TASK-INVALID-001",
            RunId = "RUN-001",
            AgentType = (AgentType)999,
            Claims = ["Bad payload"],
            EvidenceRefs = ["request"],
            Confidence = 0.5,
            CreatedUtc = DateTime.UtcNow
        };

        SchemaValidationService validationService = new(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        DecisionEngineService service = new(validationService);

        DecisionMergeResult result = service.MergeResults(
            runId: "RUN-001",
            request: request,
            manifestVersion: "v1",
            results: [invalid],
            evaluations: [],
            decisionNodes: []);

        result.Success.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }
}

