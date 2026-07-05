using ArchLucid.Api.Validators;
using ArchLucid.Application.Analysis;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureAnalysisRequestValidatorTests
{
    private readonly ArchitectureAnalysisRequestValidator _validator = new();

    [Fact]
    public void Minimal_request_passes()
    {
        ArchitectureAnalysisRequest request = new() { RunId = "run-1" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Determinism_iterations_out_of_range_when_check_enabled_fails()
    {
        ArchitectureAnalysisRequest request = new()
        {
            RunId = "run-1",
            IncludeDeterminismCheck = true,
            DeterminismIterations = 1,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Manifest_compare_without_version_fails()
    {
        ArchitectureAnalysisRequest request = new()
        {
            RunId = "run-1",
            IncludeManifestCompare = true,
            CompareManifestVersion = "",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Agent_result_compare_without_run_id_fails()
    {
        ArchitectureAnalysisRequest request = new()
        {
            RunId = "run-1",
            IncludeAgentResultCompare = true,
            CompareRunId = "",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
