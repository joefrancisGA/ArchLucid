using System.Diagnostics.CodeAnalysis;
using System.Text;

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

        bool jsonStdout = args.Contains("--json", StringComparer.OrdinalIgnoreCase);

        string? profileName = TryReadProfileName(args);

        if (string.Equals(profileName, ConfigLintProfileNames.ProductionLikeHostedPilot, StringComparison.Ordinal))
        {
            simulateProduction = true;
            strictStaging = true;
            hostingAdvisor = true;
        }

        string? jsonOutPath = TryReadPathArgument(args, "--json-out");

        string? markdownOutPath = TryReadPathArgument(args, "--markdown-out");

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

        ConfigLintReportDocument report = ConfigLintReportBuilder.Build(lintSnapshot, profileName);

        if (jsonStdout || jsonOutPath is not null || markdownOutPath is not null)
        {
            string json = ConfigLintReportBuilder.ToJson(report);

            if (jsonStdout)
                Console.WriteLine(json);

            if (jsonOutPath is not null)
                File.WriteAllText(jsonOutPath, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

            if (markdownOutPath is not null)
            {
                string markdown = ConfigLintReportBuilder.ToMarkdown(report);
                File.WriteAllText(markdownOutPath, markdown, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            }

            return Task.FromResult(report.Ok ? CliExitCode.Success : CliExitCode.OperationFailed);
        }

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

    private static string? TryReadProfileName(string[] args)
    {
        for (int index = 0; index < args.Length - 1; index++)
        {
            if (string.Equals(args[index], "--profile", StringComparison.OrdinalIgnoreCase))
                return args[index + 1].Trim();
        }

        return null;
    }

    private static string? TryReadPathArgument(string[] args, string flagName)
    {
        for (int index = 0; index < args.Length - 1; index++)
        {
            if (string.Equals(args[index], flagName, StringComparison.OrdinalIgnoreCase))
                return args[index + 1].Trim();
        }

        return null;
    }

    private static IConfiguration BuildMergedConfiguration(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli,
        bool simulateProductionForLint,
        bool strictStagingForLint)
    {
        List<KeyValuePair<string, string?>> baseOverlays = [];

        if (cli is not null && !string.IsNullOrWhiteSpace(cli.ApiUrl))

            baseOverlays.Add(
                new KeyValuePair<string, string?>("ARCHLUCID_API_URL", cli.ApiUrl.Trim().TrimEnd('/')));

        IConfigurationBuilder builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", true, true)
            .AddJsonFile("appsettings.json", true, true)
            .AddInMemoryCollection(baseOverlays)
            .AddEnvironmentVariables();

        if (simulateProductionForLint)

            builder.AddInMemoryCollection(
                [new KeyValuePair<string, string?>("ASPNETCORE_ENVIRONMENT", Environments.Production)]);

        if (strictStagingForLint)

            builder.AddInMemoryCollection(
                [new KeyValuePair<string, string?>("ProductionValidation:Strict", "true")]);

        return builder.Build();
    }
}
