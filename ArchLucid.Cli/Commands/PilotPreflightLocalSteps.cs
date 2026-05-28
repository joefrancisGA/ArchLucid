using ArchLucid.Cli.Diagnostics;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static class PilotPreflightLocalSteps
{
    internal static IReadOnlyList<PilotPreflightStepResult> Evaluate(
        IConfiguration configuration,
        bool simulateProduction = false)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        List<PilotPreflightStepResult> steps = [];
        string contentRoot = Directory.GetCurrentDirectory();
        bool appsettingsExists = File.Exists(Path.Combine(contentRoot, "appsettings.json"))
                                 || File.Exists(Path.Combine(contentRoot, "archlucid.json"));

        IReadOnlyList<ValidateConfigFinding> findings =
            ValidateConfigEvaluator.Evaluate(configuration, contentRoot, appsettingsExists);

        foreach (ValidateConfigFinding finding in findings)
        {
            if (finding.Severity == ValidateConfigFindingSeverity.Info)
                continue;

            PilotPreflightDisposition disposition = finding.Severity switch
            {
                ValidateConfigFindingSeverity.Error => PilotPreflightDisposition.Block,
                ValidateConfigFindingSeverity.Warning => PilotPreflightDisposition.Warn,
                _ => PilotPreflightDisposition.Pass,
            };

            steps.Add(new PilotPreflightStepResult
            {
                Name = $"config:{finding.Category}:{finding.Check}",
                Disposition = disposition,
                Detail = finding.Detail,
                Remediation = disposition == PilotPreflightDisposition.Block
                    ? "Fix the configuration key in appsettings or environment variables — see docs/library/CONFIGURATION_REFERENCE.md."
                    : null,
            });
        }

        steps.Add(EvaluateAuthMode(configuration));
        steps.AddRange(PilotPreflightProductionLikeAuthSteps.Evaluate(configuration, contentRoot, simulateProduction));

        return steps;
    }

    internal static IConfiguration LoadLocalConfiguration(bool simulateProduction = false)
    {
        if (!simulateProduction)
            return DoctorLocalConfiguration.CreateForDoctor();

        return new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", optional: true, reloadOnChange: false)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddInMemoryCollection(
                new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
                {
                    ["ASPNETCORE_ENVIRONMENT"] = Microsoft.Extensions.Hosting.Environments.Production,
                })
            .AddEnvironmentVariables()
            .Build();
    }

    private static PilotPreflightStepResult EvaluateAuthMode(IConfiguration configuration)
    {
        string? mode = configuration["ArchLucidAuth:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(mode))
        {
            return new PilotPreflightStepResult
            {
                Name = "config:ArchLucidAuth:Mode",
                Disposition = PilotPreflightDisposition.Block,
                Detail = "ArchLucidAuth:Mode is unset — first pilot requires an explicit auth mode.",
                Remediation = "Set ArchLucidAuth:Mode (DevelopmentBypass locally only, ApiKey, JwtBearer, or Entra).",
            };
        }

        return new PilotPreflightStepResult
        {
            Name = "config:ArchLucidAuth:Mode",
            Disposition = PilotPreflightDisposition.Pass,
            Detail = mode,
        };
    }
}
