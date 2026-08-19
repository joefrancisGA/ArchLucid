using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanRequestValidatorTests
{
    private static readonly QuickScanOptions DefaultOptions = new();

    [Fact]
    public void TryValidate_rejects_unsupported_primary_environment()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            PrimaryEnvironment = "RandomCloud",
            Description = "desc",
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("primaryEnvironment");
    }

    [Fact]
    public void TryValidate_accepts_legacy_cloud_provider_alias()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            CloudProvider = "Azure",
            Description = "desc",
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out QuickScanRequestValidator.ValidatedQuickScanRequest? validated, out _);

        ok.Should().BeTrue();
        validated!.PrimaryEnvironment.Should().Be("Azure");
    }

    [Theory]
    [InlineData("AWS")]
    [InlineData("GoogleCloud")]
    public void TryValidate_accepts_aws_and_gcp_primary_environment(string primaryEnvironment)
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            PrimaryEnvironment = primaryEnvironment,
            Description = "desc",
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out QuickScanRequestValidator.ValidatedQuickScanRequest? validated, out _);

        ok.Should().BeTrue();
        validated!.PrimaryEnvironment.Should().Be(primaryEnvironment);
    }

    [Fact]
    public void TryValidate_limits_architecture_concerns()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "API",
            PrimaryEnvironment = "Azure",
            Description = "desc",
            ArchitectureConcerns = ["Security", "Reliability", "Cost", "Performance"],
        };

        bool ok = QuickScanRequestValidator.TryValidate(request, DefaultOptions, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("at most");
    }
}
