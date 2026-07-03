using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SubmitAgentResultRequestValidatorTests
{
    private readonly SubmitAgentResultRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_result_null()
    {
        SubmitAgentResultRequest request = new() { Result = null! };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_fails_when_confidence_out_of_range()
    {
        SubmitAgentResultRequest request = new()
        {
            Result = new AgentResult
            {
                ResultId = "r1",
                RunId = "run-1",
                TaskId = "task-1",
                AgentType = AgentType.Topology,
                Confidence = 1.5,
                Claims = [],
                EvidenceRefs = []
            }
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Confidence"));
    }

    [Fact]
    public void Validate_passes_for_minimal_valid_result()
    {
        SubmitAgentResultRequest request = new()
        {
            Result = new AgentResult
            {
                ResultId = "r1",
                RunId = "run-1",
                TaskId = "task-1",
                AgentType = AgentType.Topology,
                Confidence = 0.8,
                Claims = ["claim"],
                EvidenceRefs = []
            }
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
