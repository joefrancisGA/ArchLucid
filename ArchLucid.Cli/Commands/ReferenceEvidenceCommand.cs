namespace ArchLucid.Cli.Commands;

/// <summary>
///     Downloads reference-evidence artifacts for a committed run (tenant scope) or a tenant-wide ZIP (admin).
/// </summary>
internal static partial class ReferenceEvidenceCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ReferenceEvidenceArgs parsed = ReferenceEvidenceArgs.Parse(args);

        if (!parsed.IsValid)
        {
            Console.WriteLine(
                "Usage: archlucid reference-evidence --run <runId> [--out <dir>] [--include-demo]\n"
                + "       archlucid reference-evidence --tenant <tenantId> [--out <dir>] [--include-demo]\n"
                + "       (alias: archlucid proof-pack — same options; buyer-facing name for the ZIP path)");

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(outcome);

        string normalized = baseUrl.Trim().TrimEnd('/');
        using HttpClient http = new();
        http.Timeout = TimeSpan.FromMinutes(3);
        http.BaseAddress = new Uri(normalized + "/");

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            http.DefaultRequestHeaders.Remove("X-Api-Key");
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        }

        if (parsed.TenantId is { } tenantId)
            return await DownloadTenantZipAsync(http, tenantId, parsed.OutputDirectory, parsed.IncludeDemo,
                cancellationToken);

        return await DownloadRunBundleAsync(http, parsed.RunId!, parsed.OutputDirectory, parsed.IncludeDemo,
            cancellationToken);
    }
}
