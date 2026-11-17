using ArchLucid.Application.SecureNow;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowCapacityOptionsTests
{
    [Fact]
    public void Defaults_are_finite()
    {
        SecureNowCapacityOptions options = new();
        options.Validate();
        options.MaxWaitingCollectionTriggers.Should().Be(100);
        options.AdmissionTimeoutSeconds.Should().Be(5);
        SecureNowCapacityOptions.ActiveCollectionTriggers.Should().Be(8);
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(10001, 5)]
    [InlineData(100, 0)]
    [InlineData(100, 301)]
    public void Invalid_capacity_budget_fails(int waiting, int seconds)
    {
        SecureNowCapacityOptions options = new()
        {
            MaxWaitingCollectionTriggers = waiting,
            AdmissionTimeoutSeconds = seconds,
        };
        Action validate = options.Validate;
        validate.Should().Throw<ArgumentOutOfRangeException>();
    }
}
