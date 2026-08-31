using ArchLucid.Api.Http;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

public sealed class AuditQueryStringValidationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("RunStarted")]
    public void TryValidateOptionalFilterText_accepts_null_empty_and_normal_values(string? value)
    {
        AuditQueryStringValidation.TryValidateOptionalFilterText(value, out string? error)
            .Should().BeTrue(error);
    }

    [Fact]
    public void TryValidateOptionalFilterText_rejects_unpaired_surrogates()
    {
        string invalid = "\uD800";

        AuditQueryStringValidation.TryValidateOptionalFilterText(invalid, out string? error)
            .Should().BeFalse();

        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryValidateOptionalFilterText_rejects_excessive_length()
    {
        string invalid = new('a', 257);

        AuditQueryStringValidation.TryValidateOptionalFilterText(invalid, out string? error)
            .Should().BeFalse();

        error.Should().Contain("256");
    }
}
