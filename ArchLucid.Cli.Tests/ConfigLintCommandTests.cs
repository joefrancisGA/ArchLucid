using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>Integration-style exercises for <c>archlucid config lint</c>.</summary>
[Trait("Suite", "Configuration")]
public sealed class ConfigLintCommandTests
{
    [Fact]
    public async Task ConfigLint_WithDevelopmentAspnetAndEmptyAppsettings_ReturnsSuccess()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(Path.Combine(temp, "appsettings.json"), "{}");

        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development", EnvironmentVariableTarget.Process);
            Environment.CurrentDirectory = temp;

            StringBuilder errSb = new();
            TextWriter prevE = Console.Error;

            try
            {
                Console.SetError(new StringWriter(errSb));

                int exit = await Program.RunAsync(["config", "lint"]);

                exit.Should().Be(CliExitCode.Success, errSb.ToString());
            }

            finally
            {
                Console.SetError(prevE);
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
                // best-effort cleanup
            }
        }
    }

    [Fact]
    public async Task ConfigLint_SimulateProduction_DevelopmentBypassIsBlocked()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            "{\"ArchLucidAuth\":{\"Mode\":\"DevelopmentBypass\"}}");

        try
        {
            Environment.CurrentDirectory = temp;

            StringBuilder errSb = new();
            TextWriter prevE = Console.Error;

            try
            {
                Console.SetError(new StringWriter(errSb));

                int exit = await Program.RunAsync(["config", "lint", "--simulate-production"]);

                exit.Should().Be(CliExitCode.OperationFailed, errSb.ToString());
                errSb.ToString().Should().Contain("DevelopmentBypass").And.Contain("ASPNETCORE_ENVIRONMENT");
            }

            finally
            {
                Console.SetError(prevE);
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
                // best-effort cleanup
            }
        }
    }

    [Fact]
    public async Task ConfigLint_ProductionLikeProfile_WithCleanDevelopmentConfig_WritesJsonReport()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            """
            {
              "ArchLucidAuth": { "Mode": "ApiKey" },
              "Authentication": { "ApiKey": { "Enabled": true } },
              "Retrieval": {
                "VectorIndex": "AzureSearch",
                "AzureSearch": {
                  "Endpoint": "https://example.search.windows.net",
                  "IndexName": "archlucid-retrieval-test"
                }
              }
            }
            """);

        string jsonPath = Path.Combine(temp, "config-lint-production-like-hosted-pilot.json");

        try
        {
            Environment.CurrentDirectory = temp;

            int exit = await Program.RunAsync(
              [
                  "config",
                  "lint",
                  "--profile",
                  "production-like-hosted-pilot",
                  "--json-out",
                  jsonPath,
              ]);

            exit.Should().Be(CliExitCode.Success);
            File.Exists(jsonPath).Should().BeTrue();

            using JsonDocument document = JsonDocument.Parse(await File.ReadAllTextAsync(jsonPath));
            JsonElement root = document.RootElement;
            root.GetProperty("profileName").GetString().Should().Be("production-like-hosted-pilot");
            root.GetProperty("ok").GetBoolean().Should().BeTrue();
            root.GetProperty("hostingEnvironmentName").GetString().Should().Be("Production");
            root.GetProperty("schema").GetString().Should().Be("archlucid.config-lint-report.v1");
            string proofDisposition = root.GetProperty("proofDisposition").GetString()!;
            proofDisposition.Should().BeOneOf("READY", "WARN");
            root.GetProperty("sponsorHandoffRecommended").GetBoolean().Should().BeTrue();
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
                // best-effort cleanup
            }
        }
    }

    [Fact]
    public async Task ConfigLint_ProductionLikeProfile_WithInMemoryVectorIndex_ReturnsHoldJson()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            """
            {
              "ArchLucidAuth": { "Mode": "ApiKey" },
              "Authentication": { "ApiKey": { "Enabled": true } },
              "Retrieval": { "VectorIndex": "InMemory" }
            }
            """);

        string jsonPath = Path.Combine(temp, "config-lint-production-like-hosted-pilot.json");

        try
        {
            Environment.CurrentDirectory = temp;

            int exit = await Program.RunAsync(
              [
                  "config",
                  "lint",
                  "--profile",
                  "production-like-hosted-pilot",
                  "--json-out",
                  jsonPath,
              ]);

            exit.Should().Be(CliExitCode.OperationFailed);
            File.Exists(jsonPath).Should().BeTrue();

            using JsonDocument document = JsonDocument.Parse(await File.ReadAllTextAsync(jsonPath));
            JsonElement root = document.RootElement;
            root.GetProperty("ok").GetBoolean().Should().BeFalse();
            root.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
            root.GetProperty("sponsorHandoffRecommended").GetBoolean().Should().BeFalse();
            root.GetRawText().Should().Contain("azure_ai_search_vector_index_required_production_like");
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
                // best-effort cleanup
            }
        }
    }

    [Fact]
    public async Task ConfigLint_ProductionLikeProfile_WithDevelopmentBypass_ReturnsFailureJson()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            "{\"ArchLucidAuth\":{\"Mode\":\"DevelopmentBypass\"}}");

        string jsonPath = Path.Combine(temp, "config-lint-production-like-hosted-pilot.json");

        try
        {
            Environment.CurrentDirectory = temp;

            int exit = await Program.RunAsync(
              [
                  "config",
                  "lint",
                  "--profile",
                  "production-like-hosted-pilot",
                  "--json-out",
                  jsonPath,
              ]);

            exit.Should().Be(CliExitCode.OperationFailed);
            File.Exists(jsonPath).Should().BeTrue();

            using JsonDocument document = JsonDocument.Parse(await File.ReadAllTextAsync(jsonPath));
            JsonElement root = document.RootElement;
            root.GetProperty("ok").GetBoolean().Should().BeFalse();
            root.GetProperty("blockingFindings").GetArrayLength().Should().BeGreaterThan(0);
            root.GetRawText().Should().Contain("DevelopmentBypass");
            JsonElement blocking = root.GetProperty("blockingFindings")[0];
            blocking.GetProperty("ruleName").GetString().Should().NotBeNullOrWhiteSpace();
            blocking.GetProperty("whyItMatters").GetString().Should().NotBeNullOrWhiteSpace();
            blocking.GetProperty("configKeys").GetString().Should().Contain("ArchLucidAuth:Mode");
            blocking.GetProperty("remediationHint").GetString().Should().NotBeNullOrWhiteSpace();
            blocking.GetProperty("expectedProofArtifact").GetString().Should().NotBeNullOrWhiteSpace();
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
                // best-effort cleanup
            }
        }
    }

    [Fact]
    public async Task ConfigLint_ProductionLikeProfile_WithRealWarnOnlyQualityGate_ReturnsHoldJson()
    {
        string prevCwd = Environment.CurrentDirectory;

        Dictionary<string, string?> saved = SaveClearEnv(
          ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT", "ARCHLUCID_ENVIRONMENT", "ARCHLUCID_API_URL"]);

        string temp =
            Path.Combine(Path.GetTempPath(), "ArchLucid.Cli.Tests.configLint." + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(temp);

        await File.WriteAllTextAsync(
            Path.Combine(temp, "appsettings.json"),
            """
            {
              "ArchLucidAuth": { "Mode": "ApiKey" },
              "Authentication": { "ApiKey": { "Enabled": true } },
              "AgentExecution": { "Mode": "Real" },
              "ArchLucid": {
                "AgentOutput": {
                  "QualityGate": { "Mode": "WarnOnly" }
                }
              },
              "Retrieval": {
                "VectorIndex": "AzureSearch",
                "AzureSearch": {
                  "Endpoint": "https://example.search.windows.net",
                  "IndexName": "archlucid-retrieval-test"
                }
              }
            }
            """);

        string jsonPath = Path.Combine(temp, "config-lint-production-like-hosted-pilot.json");

        try
        {
            Environment.CurrentDirectory = temp;

            int exit = await Program.RunAsync(
              [
                  "config",
                  "lint",
                  "--profile",
                  "production-like-hosted-pilot",
                  "--json-out",
                  jsonPath,
              ]);

            exit.Should().Be(CliExitCode.OperationFailed);
            File.Exists(jsonPath).Should().BeTrue();

            using JsonDocument document = JsonDocument.Parse(await File.ReadAllTextAsync(jsonPath));
            JsonElement root = document.RootElement;
            root.GetProperty("ok").GetBoolean().Should().BeFalse();
            root.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
            root.GetRawText().Should().Contain("quality_gate_warn_only_in_real_production_like");
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
                // best-effort cleanup
            }
        }
    }

    private static Dictionary<string, string?> SaveClearEnv(string[] keys)
    {
        Dictionary<string, string?> saved = new(StringComparer.Ordinal);

        foreach (string k in keys)
        {
            saved[k] = Environment.GetEnvironmentVariable(k);
            Environment.SetEnvironmentVariable(k, null, EnvironmentVariableTarget.Process);
        }

        return saved;
    }

    private static void RestoreEnv(IReadOnlyDictionary<string, string?> saved)
    {
        foreach (KeyValuePair<string, string?> kvp in saved)
            Environment.SetEnvironmentVariable(kvp.Key, kvp.Value, EnvironmentVariableTarget.Process);
    }
}
