using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

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
