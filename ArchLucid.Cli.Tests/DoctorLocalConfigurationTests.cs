using ArchLucid.Cli.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
public sealed class DoctorLocalConfigurationTests
{
    [Fact]
    public void CreateForDoctor_merges_appsettings_and_environment_overlay()
    {
        using TempDirectory temp = new();

        File.WriteAllText(
            Path.Combine(temp.Path, "appsettings.json"),
            """{ "Doctor": { "Base": "yes" } }""");

        File.WriteAllText(
            Path.Combine(temp.Path, "appsettings.Development.json"),
            """{ "Doctor": { "Overlay": "dev" } }""");

        string? previousAspNet = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        string previousCwd = Directory.GetCurrentDirectory();

        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
            Directory.SetCurrentDirectory(temp.Path);

            IConfiguration configuration = DoctorLocalConfiguration.CreateForDoctor();

            configuration["Doctor:Base"].Should().Be("yes");
            configuration["Doctor:Overlay"].Should().Be("dev");
        }
        finally
        {
            Directory.SetCurrentDirectory(previousCwd);
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
