using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static Task<int> HandleHealth(string[] normalized) =>
        HealthCommand.RunAsync();


    internal static Task<int> HandleValidateConfig(string[] normalized) =>
        ValidateConfigCommand.RunAsync(
            normalized
                .Skip(1)
                .ToArray());


    internal static Task<int> HandleOnboardPreflight(string[] normalized) =>
        OnboardPreflightCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleDoctor(string[] normalized) =>
        DoctorCommand.RunAsync(CliCommandShared.TryLoadConfigFromCwd());


    internal static Task<int> HandleDeploymentEvidence(string[] normalized) =>
        DeploymentEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleDocs(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "pdf", StringComparison.Ordinal)
            && string.Equals(normalized[2], "render", StringComparison.Ordinal))
            return await DocsPdfRenderCommand.RunAsync(normalized.Skip(3).ToArray());

        Console.WriteLine(
            "Usage: archlucid docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSupport(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "incident-readiness-drill", StringComparison.OrdinalIgnoreCase))
            return await SupportIncidentReadinessDrillCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine("Usage: archlucid support incident-readiness-drill --out <directory>");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleSupportBundle(string[] normalized) =>
        SupportBundleCommand.RunAsync(normalized.Skip(1).ToArray());
}
