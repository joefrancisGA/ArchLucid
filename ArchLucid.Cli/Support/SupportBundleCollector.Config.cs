using ArchLucid.Cli.Commands;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Support;

public static partial class SupportBundleCollector
{
    private static SupportBundleConfigSummary BuildConfigSummary(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string workingDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workingDirectory);

        string root = Path.GetFullPath(workingDirectory);

        SupportBundleConfigSummary summary;

        if (config is null)
        {
            string fallbackUrl = SupportBundleRedactor.RedactHttpUrl(ArchLucidApiClient.ResolveBaseUrl(null));

            summary = new SupportBundleConfigSummary { HasArchlucidJson = false, ApiBaseUrlRedacted = fallbackUrl };
        }
        else
        {
            string resolved = ArchLucidApiClient.ResolveBaseUrl(config);

            summary = new SupportBundleConfigSummary
            {
                HasArchlucidJson = true,
                ProjectName = config.ProjectName,
                SchemaVersion = config.SchemaVersion,
                ApiBaseUrlRedacted = SupportBundleRedactor.RedactHttpUrl(resolved),
                InputsBriefPath = config.Inputs.Brief,
                OutputsLocalCacheDir = config.Outputs.LocalCacheDir,
                PluginsLockFile = config.Plugins?.LockFile,
                TerraformEnabled = config.Infra?.Terraform.Enabled,
                TerraformPath = config.Infra?.Terraform.Path,
                Architecture = config.Architecture
            };
        }

        IConfiguration merged = ValidateConfigConfigurationFactory.BuildMerged(config, root);
        bool appsettingsExists = ValidateConfigConfigurationFactory.AppsettingsFileExists(root);
        IReadOnlyList<ValidateConfigFinding> findings = ValidateConfigEvaluator.Evaluate(merged, root, appsettingsExists);

        List<SupportBundleValidateConfigAlert> alerts = findings
            .Where(static f => f.Severity is ValidateConfigFindingSeverity.Warning or ValidateConfigFindingSeverity.Error)
            .Select(static f => new SupportBundleValidateConfigAlert
            {
                Severity = f.Severity.ToString(),
                Category = f.Category,
                Check = f.Check
            })
            .ToList();

        string? storageRaw = merged["ArchLucid:StorageProvider"]?.Trim();
        string storageSummary = string.IsNullOrWhiteSpace(storageRaw)
            ? "Sql (default when ArchLucid:StorageProvider is unset)"
            : storageRaw;

        string? authMode = merged["ArchLucidAuth:Mode"]?.Trim();
        string authSummary = string.IsNullOrWhiteSpace(authMode)
            ? "unset — host template defaults (confirm ArchLucidAuth:Mode in appsettings)"
            : authMode;

        bool outboundKey = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY"));

        return new SupportBundleConfigSummary
        {
            HasArchlucidJson = summary.HasArchlucidJson,
            ProjectName = summary.ProjectName,
            SchemaVersion = summary.SchemaVersion,
            ApiBaseUrlRedacted = summary.ApiBaseUrlRedacted,
            InputsBriefPath = summary.InputsBriefPath,
            OutputsLocalCacheDir = summary.OutputsLocalCacheDir,
            PluginsLockFile = summary.PluginsLockFile,
            TerraformEnabled = summary.TerraformEnabled,
            TerraformPath = summary.TerraformPath,
            Architecture = summary.Architecture,
            StorageProviderSummary = storageSummary,
            HostAuthModeSummary = authSummary,
            CliOutboundApiKeyEnvironmentPresent = outboundKey,
            ValidateConfigAlerts = alerts
        };
    }
}
