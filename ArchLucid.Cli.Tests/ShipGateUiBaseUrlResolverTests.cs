using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ShipGateUiBaseUrlResolverTests
{
    private const string ExplicitUrl = "https://ops.example.com";

    [Fact]
    public void Resolve_SkipFlag_ReturnsSkippedWithoutUrl()
    {
        ShipGateUiBaseUrlResolution resolution = ShipGateUiBaseUrlResolver.Resolve(
            ["--run-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--skip-ui-route-smoke"],
            null);

        resolution.BaseUrl.Should().BeNull();
        resolution.Source.Should().Be(ShipGateUiBaseUrlResolution.SkippedSource);
    }

    [Fact]
    public void Resolve_ExplicitArg_TakesPrecedenceOverEnvAndConfig()
    {
        string? priorEnv = Environment.GetEnvironmentVariable("ARCHLUCID_UI_BASE_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", "https://env.example.com");

            ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
            {
                UiUrl = "https://config.example.com",
            };

            ShipGateUiBaseUrlResolution resolution = ShipGateUiBaseUrlResolver.Resolve(
                ["--run-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--ui-base-url", ExplicitUrl],
                config);

            resolution.BaseUrl.Should().Be(ExplicitUrl);
            resolution.Source.Should().Be(ShipGateUiBaseUrlResolution.ExplicitArgSource);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", priorEnv);
        }
    }

    [Fact]
    public void Resolve_EnvironmentVariable_UsedWhenArgAbsent()
    {
        string? priorEnv = Environment.GetEnvironmentVariable("ARCHLUCID_UI_BASE_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", "https://env.example.com/");

            ShipGateUiBaseUrlResolution resolution = ShipGateUiBaseUrlResolver.Resolve(
                ["--run-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
                null);

            resolution.BaseUrl.Should().Be("https://env.example.com");
            resolution.Source.Should().Be(ShipGateUiBaseUrlResolution.EnvironmentSource);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", priorEnv);
        }
    }

    [Fact]
    public void Resolve_ConfigUiUrl_UsedWhenArgAndEnvAbsent()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            UiUrl = "https://config.example.com/",
        };

        ShipGateUiBaseUrlResolution resolution = ShipGateUiBaseUrlResolver.Resolve(
            ["--run-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
            config);

        resolution.BaseUrl.Should().Be("https://config.example.com");
        resolution.Source.Should().Be(ShipGateUiBaseUrlResolution.ConfigSource);
    }

    [Fact]
    public void Resolve_DefaultUnconfigured_WhenNoOverrides()
    {
        string? priorEnv = Environment.GetEnvironmentVariable("ARCHLUCID_UI_BASE_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", null);

            ShipGateUiBaseUrlResolution resolution = ShipGateUiBaseUrlResolver.Resolve(
                ["--run-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
                null);

            resolution.BaseUrl.Should().BeNull();
            resolution.Source.Should().Be(ShipGateUiBaseUrlResolution.UnconfiguredSource);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_UI_BASE_URL", priorEnv);
        }
    }
}
