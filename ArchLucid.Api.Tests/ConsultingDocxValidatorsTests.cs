using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

using ApiConsultingDocxProfileRecommendationRequest = ArchLucid.Api.Models.ConsultingDocxProfileRecommendationRequest;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConsultingDocxValidatorsTests
{
    private readonly ConsultingDocxExportRequestValidator _exportValidator = new();
    private readonly ConsultingDocxProfileRecommendationRequestValidator _profileValidator = new();

    [Fact]
    public void ExportValidator_fails_when_compare_manifest_version_missing_and_compare_enabled()
    {
        ConsultingDocxExportRequest request = new()
        {
            IncludeManifestCompare = true,
            CompareManifestVersion = "",
        };

        ValidationResult result = _exportValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ConsultingDocxExportRequest.CompareManifestVersion));
    }

    [Fact]
    public void ExportValidator_fails_when_determinism_iterations_out_of_range()
    {
        ConsultingDocxExportRequest request = new() { DeterminismIterations = 1 };

        ValidationResult result = _exportValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ConsultingDocxExportRequest.DeterminismIterations));
    }

    [Fact]
    public void ProfileRecommendationValidator_fails_when_audience_exceeds_max_length()
    {
        ApiConsultingDocxProfileRecommendationRequest request = new()
        {
            Audience = new string('a', 501),
        };

        ValidationResult result = _profileValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should()
            .Contain(e => e.PropertyName == nameof(ApiConsultingDocxProfileRecommendationRequest.Audience));
    }

    [Fact]
    public void ProfileRecommendationValidator_passes_for_minimal_valid_request()
    {
        ApiConsultingDocxProfileRecommendationRequest request = new() { Audience = "CIO" };

        ValidationResult result = _profileValidator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
