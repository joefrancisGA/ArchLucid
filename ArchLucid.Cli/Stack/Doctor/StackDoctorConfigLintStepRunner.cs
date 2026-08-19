using ArchLucid.Cli.Commands;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorConfigLintStepRunner
{
    internal static StackDoctorStepResult Run(bool productionLike)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();
        IConfiguration local = BuildMergedConfiguration(cli, simulateProduction: true, strictStaging: productionLike);
        string envName =
            local["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environments.Production;

        OperatorConfigurationLintSnapshot lintSnapshot =
            OperatorConfigurationLintEvaluator.Evaluate(local, envName.Trim());

        string? profileName = productionLike ? ConfigLintProfileNames.ProductionLikeHostedPilot : null;
        ConfigLintReportDocument report = ConfigLintReportBuilder.Build(lintSnapshot, profileName);

        if (report.Ok && report.AdvisoryFindings.Count == 0)
        {
            return new StackDoctorStepResult
            {
                StepId = "config-lint",
                DisplayName = productionLike
                    ? "Production-like config lint"
                    : "Config lint (simulate production)",
                Verdict = StackDoctorVerdict.Pass,
                Detail = $"Disposition {report.Disposition}; 0 blocking, 0 advisory findings.",
            };
        }

        if (report.Ok)
        {
            return new StackDoctorStepResult
            {
                StepId = "config-lint",
                DisplayName = productionLike
                    ? "Production-like config lint"
                    : "Config lint (simulate production)",
                Verdict = StackDoctorVerdict.Warn,
                Detail =
                    $"Disposition {report.Disposition}; 0 blocking, {report.AdvisoryFindings.Count} advisory finding(s).",
            };
        }

        return new StackDoctorStepResult
        {
            StepId = "config-lint",
            DisplayName = productionLike
                ? "Production-like config lint"
                : "Config lint (simulate production)",
            Verdict = StackDoctorVerdict.Fail,
            Detail =
                $"Disposition {report.Disposition}; {report.BlockingFindings.Count} blocking, {report.AdvisoryFindings.Count} advisory finding(s).",
        };
    }

    private static IConfiguration BuildMergedConfiguration(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli,
        bool simulateProduction,
        bool strictStaging)
    {
        List<KeyValuePair<string, string?>> baseOverlays = [];

        if (cli is not null && !string.IsNullOrWhiteSpace(cli.ApiUrl))
        {
            baseOverlays.Add(
                new KeyValuePair<string, string?>("ARCHLUCID_API_URL", cli.ApiUrl.Trim().TrimEnd('/')));
        }

        IConfigurationBuilder builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", true, true)
            .AddJsonFile("appsettings.json", true, true)
            .AddInMemoryCollection(baseOverlays)
            .AddEnvironmentVariables();

        if (simulateProduction)
        {
            builder.AddInMemoryCollection(
                [new KeyValuePair<string, string?>("ASPNETCORE_ENVIRONMENT", Environments.Production)]);
        }

        if (strictStaging)
        {
            builder.AddInMemoryCollection(
                [new KeyValuePair<string, string?>("ProductionValidation:Strict", "true")]);
        }

        return builder.Build();
    }
}
