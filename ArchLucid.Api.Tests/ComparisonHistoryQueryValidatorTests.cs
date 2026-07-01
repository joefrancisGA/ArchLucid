using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

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
