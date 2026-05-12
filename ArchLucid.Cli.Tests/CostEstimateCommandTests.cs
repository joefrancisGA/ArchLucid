using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CostEstimateCommandTests
{
    private const string ManifestWithTwoBillableNodes =
        """
        {
          "runId": "11111111-1111-1111-1111-111111111111",
          "systemName": "cost-demo",
          "services": [
            {
              "serviceId": "svc-api",
              "serviceName": "api",
              "serviceType": "Api",
              "runtimePlatform": "AppService"
            }
          ],
          "datastores": [
            {
              "datastoreId": "ds-sql",
              "datastoreName": "orders",
              "datastoreType": "Sql",
              "runtimePlatform": "SqlServer"
            }
          ],
          "relationships": [],
          "governance": {},
          "metadata": {
            "manifestVersion": "1",
            "createdUtc": "2026-01-01T00:00:00Z"
          }
        }
        """;

    [Fact]
    public async Task Cost_estimate_prints_table_and_totals_mock_monthly_usd()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "my-arch.json");
            await File.WriteAllTextAsync(path, ManifestWithTwoBillableNodes);

            int exit = await Program.RunAsync(["cost-estimate", path]);

            exit.Should().Be(CliExitCode.Success);
            string output = outWriter.ToString();
            output.Should().Contain("Service");
            output.Should().Contain("Datastore");
            output.Should().Contain("api");
            output.Should().Contain("orders");
            output.Should().Contain("Azure App Service");
            output.Should().Contain("Azure SQL");
            output.Should().Contain("$45");
            output.Should().Contain("$15");
            output.Should().Contain("Total (mock):");
            output.Should().Contain("$60");
            errWriter.ToString().Should().BeEmpty();
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    [Fact]
    public async Task Cost_estimate_json_mode_emits_line_items()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "my-arch.json");
            await File.WriteAllTextAsync(path, ManifestWithTwoBillableNodes);

            int exit = await Program.RunAsync(["--json", "cost-estimate", path]);

            exit.Should().Be(CliExitCode.Success);
            string line = outWriter.ToString().Trim();
            line.Should().StartWith("{");
            line.Should().Contain("\"ok\":true");
            line.Should().Contain("\"totalUsdPerMonth\":60");
            line.Should().Contain("\"azureProduct\"");
            errWriter.ToString().Should().BeEmpty();
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    [Fact]
    public async Task Cost_estimate_missing_path_exits_with_usage()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            int exit = await Program.RunAsync(["cost-estimate"]);

            exit.Should().Be(CliExitCode.UsageError);
            outWriter.ToString().Should().Contain("Usage:");
            errWriter.ToString().Should().BeEmpty();
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    [Fact]
    public async Task Cost_estimate_invalid_json_exits_with_message()
    {
        RedirectConsole(out StringWriter _, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "bad.json");
            await File.WriteAllTextAsync(path, "{ not json");

            int exit = await Program.RunAsync(["cost-estimate", path]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("[cost-estimate]");
            errWriter.ToString().Should().Contain("Invalid JSON");
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    private static void RedirectConsole(out StringWriter outWriter, out StringWriter errWriter,
        out TextWriter prevOut, out TextWriter prevErr)
    {
        outWriter = new StringWriter();
        errWriter = new StringWriter();
        prevOut = Console.Out;
        prevErr = Console.Error;
        Console.SetOut(outWriter);
        Console.SetError(errWriter);
    }

    private static void RestoreConsole(TextWriter prevOut, TextWriter prevErr)
    {
        Console.SetOut(prevOut);
        Console.SetError(prevErr);
    }

    private sealed class TempDirectory : IDisposable
    {
        public TempDirectory()
        {
            Directory.CreateDirectory(Path);
        }

        public string Path { get; } = System.IO.Path.Combine(System.IO.Path.GetTempPath(),
            "ArchLucid.Cli.Tests." + Guid.NewGuid().ToString("N")[..8]);

        public void Dispose()
        {
            Directory.Delete(Path, true);
        }
    }
}
