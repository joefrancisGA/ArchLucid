using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

using FluentValidation.Results;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BatchReplayComparisonRequestValidatorTests
{
    private readonly BatchReplayComparisonRequestValidator _validator;

    public BatchReplayComparisonRequestValidatorTests()
    {
        Mock<IOptionsMonitor<BatchReplayOptions>> batchOptionsMonitor = new();
        batchOptionsMonitor.Setup(o => o.CurrentValue).Returns(new BatchReplayOptions { MaxComparisonRecordIds = 2 });
        _validator = new BatchReplayComparisonRequestValidator(batchOptionsMonitor.Object);
    }

    [Fact]
    public void Validate_fails_when_comparison_record_ids_is_empty()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = [] };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("At least one comparison record ID"));
    }

    [Fact]
    public void Validate_fails_when_comparison_record_ids_contains_blank_entry()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1", "   "] };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("blank or whitespace"));
    }

    [Fact]
    public void Validate_fails_when_comparison_record_ids_exceeds_configured_max()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1", "rec-2", "rec-3"] };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("at most 2 entries"));
    }

    [Fact]
    public void Validate_fails_when_format_is_unrecognized()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1"], Format = "pdf" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Format must be one of"));
    }

    [Fact]
    public void Validate_fails_when_replay_mode_is_unrecognized()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1"], ReplayMode = "rewind" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("ReplayMode must be one of"));
    }

    [Fact]
    public void Validate_fails_when_profile_is_provided_but_unrecognized()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1"], Profile = "verbose" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Profile must be one of"));
    }

    [Fact]
    public void Validate_passes_when_profile_is_null()
    {
        BatchReplayComparisonRequest request = new() { ComparisonRecordIds = ["rec-1"], Profile = null };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_passes_for_well_formed_request_with_valid_profile()
    {
        BatchReplayComparisonRequest request = new()
        {
            ComparisonRecordIds = ["rec-1", "rec-2"],
            Format = "markdown",
            ReplayMode = "artifact",
            Profile = "short",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
