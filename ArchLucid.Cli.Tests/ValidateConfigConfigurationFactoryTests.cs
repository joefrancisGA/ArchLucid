using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
public sealed class ValidateConfigConfigurationFactoryTests
{
    [Fact]
    public void AppsettingsFileExists_returns_false_when_missing()
    {
        using TempDirectory temp = new();

        ValidateConfigConfigurationFactory.AppsettingsFileExists(temp.Path).Should().BeFalse();
    }

    [Fact]
    public void AppsettingsFileExists_returns_true_when_present()
    {
        using TempDirectory temp = new();

        File.WriteAllText(Path.Combine(temp.Path, "appsettings.json"), """{ "ArchLucid": { "StorageProvider": "InMemory" } }""");

        ValidateConfigConfigurationFactory.AppsettingsFileExists(temp.Path).Should().BeTrue();
    }

    [Fact]
    public void BuildMerged_overlays_cli_api_url_and_environment_specific_appsettings()
    {
        using TempDirectory temp = new();

        File.WriteAllText(
            Path.Combine(temp.Path, "appsettings.json"),
            """{ "Shared": { "FromBase": "base" } }""");

        File.WriteAllText(
            Path.Combine(temp.Path, "appsettings.Development.json"),
            """{ "Shared": { "FromEnv": "development" } }""");

        string? previousAspNet = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

            ArchLucidProjectScaffolder.ArchLucidCliConfig cli = new()
            {
                ApiUrl = "https://api.example.com/",
            };

            IConfiguration configuration = ValidateConfigConfigurationFactory.BuildMerged(cli, temp.Path);

            configuration["Shared:FromBase"].Should().Be("base");
            configuration["Shared:FromEnv"].Should().Be("development");
            configuration["ARCHLUCID_API_URL"].Should().Be("https://api.example.com");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", previousAspNet);
        }
    }

    private sealed class TempDirectory : IDisposable
    {
        public TempDirectory()
        {
            Directory.CreateDirectory(Path);
        }

        public string Path { get; } =
            System.IO.Path.Combine(System.IO.Path.GetTempPath(), "ArchLucid.Cli.Tests." + Guid.NewGuid().ToString("N")[..8]);

        public void Dispose()
        {
            Directory.Delete(Path, true);
        }
    }
}
