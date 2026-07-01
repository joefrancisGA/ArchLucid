using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonHistoryQueryValidatorTests
{
    private readonly ComparisonHistoryQueryValidator _validator = new();

    [Fact]
    public void Validate_fails_when_created_from_after_created_to()
    {
        ComparisonHistoryQuery query = new()
        {
            CreatedFromUtc = DateTime.UtcNow,
            CreatedToUtc = DateTime.UtcNow.AddDays(-1)
        };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("createdFromUtc"));
    }

    [Fact]
    public void Validate_fails_when_cursor_used_with_non_created_sort()
    {
        ComparisonHistoryQuery query = new()
        {
            Cursor = "123:abc",
            SortBy = "label"
        };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_passes_for_default_query()
    {
        ValidationResult result = _validator.Validate(new ComparisonHistoryQuery());

        result.IsValid.Should().BeTrue();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ChatIntakeRequestValidatorTests
{
    private readonly ChatIntakeRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_raw_text_too_short()
    {
        ChatIntakeRequest request = new() { RawText = "too short" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ChatIntakeRequest.RawText));
    }

    [Fact]
    public void Validate_passes_for_valid_raw_text()
    {
        ChatIntakeRequest request = new()
        {
            RawText = new string('a', 25)
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}

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
