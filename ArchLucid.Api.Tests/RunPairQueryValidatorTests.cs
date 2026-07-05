using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunPairQueryValidatorTests
{
    private readonly RunPairQueryValidator _validator = new();

    [Fact]
    public void Validate_fails_when_left_run_id_is_empty()
    {
        RunPairQuery query = new() { LeftRunId = "", RightRunId = "run-2" };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("leftRunId"));
    }

    [Fact]
    public void Validate_fails_when_right_run_id_is_empty()
    {
        RunPairQuery query = new() { LeftRunId = "run-1", RightRunId = "" };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("rightRunId"));
    }

    [Fact]
    public void Validate_fails_when_run_ids_match_case_insensitively()
    {
        RunPairQuery query = new() { LeftRunId = "run-1", RightRunId = "RUN-1" };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("must be different"));
    }

    [Fact]
    public void Validate_passes_for_distinct_run_ids()
    {
        RunPairQuery query = new() { LeftRunId = "run-1", RightRunId = "run-2" };

        ValidationResult result = _validator.Validate(query);

        result.IsValid.Should().BeTrue();
    }
}
