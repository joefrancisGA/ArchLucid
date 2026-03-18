using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Requests;
using ArchiForge.DecisionEngine.Services;
using ArchiForge.DecisionEngine.Validation;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace ArchiForge.DecisionEngine.Tests;

public sealed class SchemaValidationTests
{
    [Fact]
    public void MergeResults_InvalidAgentResultSchema_FailsCommit()
    {
        var request = new ArchitectureRequest
        {
            RequestId = "REQ-001",
            SystemName = "TestSystem",
            Description = "d"
        };

        var invalid = new AgentResult
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

        var validationService = new SchemaValidationService(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        var service = new DecisionEngineService(validationService);

        var result = service.MergeResults(
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

