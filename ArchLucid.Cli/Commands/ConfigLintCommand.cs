using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Production-configuration lint (<c>archlucid config lint</c>): auth misconfiguration traps by default;
///     optional hosted-advisor parity when <c>--hosting-advisor</c> is passed next to staged configuration.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin I/O facade; exercised via Cli integration tests.")]
internal static class ConfigLintCommand
{
    public static Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        bool simulateProduction = args.Contains("--simulate-production", StringComparer.OrdinalIgnoreCase);

        bool hostingAdvisor = args.Contains("--hosting-advisor", StringComparer.OrdinalIgnoreCase);

        bool strictStaging = args.Contains("--strict-staging", StringComparer.OrdinalIgnoreCase);

        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();

        IConfiguration local = BuildMergedConfiguration(cli, simulateProduction, strictStaging);

        string envName =
            local["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environments.Production;

        string trimmedEnv = envName.Trim();

        OperatorConfigurationLintSnapshot lintSnapshot =
            OperatorConfigurationLintEvaluator.Evaluate(local, trimmedEnv);

        List<string> blockingLines = [];

        foreach (HostingMisconfigurationWarning w in lintSnapshot.BlockingFindings)
            blockingLines.Add($"[{w.RuleName}] {w.Message}");

        foreach (string line in blockingLines)
            Console.Error.WriteLine(line);

        foreach (HostingMisconfigurationWarning w in lintSnapshot.AdvisoryFindings)
        {
            bool emit =
                hostingAdvisor
                || AzureOpenAiEndpointConnectivityLintAdvisor.IsConnectivitySurfaceRule(w.RuleName);

            if (!emit)
                continue;

            Console.Error.WriteLine($"[HostingMisconfiguration:{w.RuleName}] {w.Message}");
        }

        bool ok = blockingLines.Count == 0;

        if (ok)

            Console.WriteLine(
                "config lint OK: no blocking findings (auth traps always; hosted advisor optional via --hosting-advisor).");

        return Task.FromResult(ok ? CliExitCode.Success : CliExitCode.OperationFailed);
    }


    private static IConfiguration BuildMergedConfiguration(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli,
        bool simulateProductionForLint,
        bool strictStagingForLint)
    {
        List<KeyValuePair<string, string?>> overlays = [];

        if (cli is not null && !string.IsNullOrWhiteSpace(cli.ApiUrl))

            overlays.Add(
                new KeyValuePair<string, string?>("ARCHLUCID_API_URL", cli.ApiUrl.Trim().TrimEnd('/')));

        if (simulateProductionForLint)

            overlays.Add(new KeyValuePair<string, string?>("ASPNETCORE_ENVIRONMENT", Environments.Production));

        if (strictStagingForLint)

            overlays.Add(new KeyValuePair<string, string?>("ProductionValidation:Strict", "true"));

        return new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", true, true)
            .AddJsonFile("appsettings.json", true, true)
            .AddInMemoryCollection(overlays)
            .AddEnvironmentVariables()
            .Build();
    }
}
