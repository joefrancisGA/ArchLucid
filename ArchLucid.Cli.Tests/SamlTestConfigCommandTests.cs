using System.Text;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Configuration")]
public sealed class SamlTestConfigCommandTests
{
    [Fact]
    public async Task SamlTestConfig_WhenDisabled_ExitsSuccess_WithInfo()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
            ["ConnectionStrings__ArchLucid", "ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT"]);

        string temp = Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.saml." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            """
            {
              "ArchLucidAuth": {
                "Saml2": {
                  "Enabled": false
                }
              }
            }
            """);

        try
        {
            Environment.CurrentDirectory = temp;

            StringBuilder outSb = new();
            TextWriter prevO = Console.Out;

            try
            {
                Console.SetOut(new StringWriter(outSb));

                int exit = await Program.RunAsync(["saml", "test-config"]);

                exit.Should().Be(CliExitCode.Success);
                outSb.ToString().Should().Contain("[PASS]");
                outSb.ToString().Should().Contain("saml2.enabled");
            }
            finally
            {
                Console.SetOut(prevO);
            }
        }
        finally
        {
            Environment.CurrentDirectory = prevCwd;
            RestoreEnv(saved);

            try
            {
                Directory.Delete(temp, true);
            }
            catch
            {
            }
        }
    }

    [Fact]
    public async Task SamlTestConfig_WhenEnabledWithoutIssuer_ExitsFailure()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
            ["ConnectionStrings__ArchLucid", "ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT"]);

        string temp = Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.saml." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            """
            {
              "ArchLucidAuth": {
                "Saml2": {
                  "Enabled": true,
                  "Issuer": "",
                  "IdPMetadata": "https://metadata.example.invalid/saml"
                }
              }
            }
            """);

        try
        {
            Environment.CurrentDirectory = temp;

            StringBuilder outSb = new();
            TextWriter prevO = Console.Out;

            try
            {
                Console.SetOut(new StringWriter(outSb));

                int exit = await Program.RunAsync(["saml", "test-config"]);

                exit.Should().Be(CliExitCode.OperationFailed);
                outSb.ToString().Should().Contain("[FAIL]");
                outSb.ToString().Should().Contain("saml2.issuer");
            }
            finally
            {
                Console.SetOut(prevO);
            }
        }
        finally
        {
            Environment.CurrentDirectory = prevCwd;
            RestoreEnv(saved);

            try
            {
                Directory.Delete(temp, true);
            }
            catch
            {
            }
        }
    }

    [Fact]
    public async Task SamlTestConfig_UsageError_WhenSubcommandMissing()
    {
        int exit = await Program.RunAsync(["saml"]);

        exit.Should().Be(CliExitCode.UsageError);
    }

    private static Dictionary<string, string?> SaveClearEnv(IEnumerable<string> keys)
    {
        Dictionary<string, string?> saved = new(StringComparer.Ordinal);

        foreach (string key in keys)
        {
            saved[key] = Environment.GetEnvironmentVariable(key);
            Environment.SetEnvironmentVariable(key, null);
        }

        return saved;
    }

    private static void RestoreEnv(Dictionary<string, string?> saved)
    {
        foreach (KeyValuePair<string, string?> pair in saved)
            Environment.SetEnvironmentVariable(pair.Key, pair.Value);
    }
}
