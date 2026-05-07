using System.Diagnostics.CodeAnalysis;
using System.Text;

using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Emits a redacted Markdown deployment evidence report (health, OpenAPI, version, optional synthetic path) and fails
///     the process when a required probe does not pass (GitHub CD gate).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Orchestrates HTTP + filesystem; covered by unit tests for options, markdown, probes.")]
internal static class DeploymentEvidenceCommand
{
    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        DeploymentEvidenceOptions? options = DeploymentEvidenceOptions.Parse(args, out string? parseError);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(parseError).ConfigureAwait(false);
            await Console
                .Error
                .WriteLineAsync(
                    "Usage: archlucid deployment-evidence --environment <staging|production|dev> --api-base-url <url> "
                    + "[--out <file.md>] [--repo <dir>] [--synthetic-path /version] [--allow-missing-openapi]")
                .ConfigureAwait(false);

            return CliExitCode.UsageError;
        }

        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(options.ApiBaseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync(urlError).ConfigureAwait(false);

            return CliExitCode.ConfigurationError;
        }

        string cwd = Directory.GetCurrentDirectory();
        DeploymentEvidenceRepositoryRootResolver.TryResolve(options.RepoRoot, cwd, out string? repositoryRoot);

        string? gitSha =
            repositoryRoot is null ? null : DeploymentEvidenceGitReader.TryReadHeadSha(repositoryRoot);

        bool? gitDirty = repositoryRoot is null ? null : DeploymentEvidenceGitReader.TryReadDirty(repositoryRoot);

        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = options.ApiBaseUrl.Trim().TrimEnd('/');

        using HttpClient http =
            ArchLucidApiClient.CreateSharedApiHttpClient(baseUrl, cli);

        http.Timeout = TimeSpan.FromSeconds(120);

        int maxAttempts = ReadPositiveIntEnv("CD_POST_DEPLOY_MAX_ATTEMPTS", fallback: 1);
        int retryWaitSeconds = ReadNonNegativeIntEnv("CD_POST_DEPLOY_RETRY_WAIT_SECONDS", fallback: 10);

        DeploymentEvidenceProbeBundle? bundle = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            if (maxAttempts > 1)
            {
                await Console.Out.WriteLineAsync(
                    $">>> Deployment evidence probe attempt {attempt} of {maxAttempts} <<<").ConfigureAwait(false);
            }

            bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
                    http,
                    baseUrl,
                    options.SyntheticPath,
                    options.AllowMissingOpenApi,
                    cancellationToken)
                .ConfigureAwait(false);

            if (bundle.AllRequiredPassed)
                break;

            if (attempt < maxAttempts)
                await Task.Delay(TimeSpan.FromSeconds(retryWaitSeconds), cancellationToken).ConfigureAwait(false);
        }

        if (bundle is null)
            return CliExitCode.OperationFailed;

        string redactedBase = SupportBundleRedactor.RedactHttpUrl(baseUrl);
        string markdown = DeploymentEvidenceReportMarkdown.Compose(
            options.EnvironmentName,
            baseUrl,
            redactedBase,
            TimeProvider.System.GetUtcNow().UtcDateTime,
            repositoryRoot,
            gitSha,
            gitDirty,
            bundle,
            cli,
            options.AllowMissingOpenApi,
            options.SyntheticPath);

        string outPath = options.OutPath ?? options.ResolveDefaultOutPath();

        try
        {
            string? dir = Path.GetDirectoryName(Path.GetFullPath(outPath));

            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);

            await File.WriteAllTextAsync(outPath, markdown, Encoding.UTF8, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync("Failed to write report: " + ex.Message).ConfigureAwait(false);

            return CliExitCode.OperationFailed;
        }

        await Console.Out.WriteLineAsync("Wrote deployment evidence report: " + outPath).ConfigureAwait(false);

        if (bundle.AllRequiredPassed)
            return CliExitCode.Success;

        WriteProbeFailureAnnotations(bundle);

        await Console.Error.WriteLineAsync(
                "Deployment evidence gate failed — see probe sections in the report and fix before promoting.")
            .ConfigureAwait(false);

        return CliExitCode.OperationFailed;
    }

    private static void WriteProbeFailureAnnotations(DeploymentEvidenceProbeBundle bundle)
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("GITHUB_ACTIONS"), "true", StringComparison.OrdinalIgnoreCase))
            return;

        foreach (DeploymentEvidenceProbeResult p in bundle.Probes)
        {
            if (p.Passed)
                continue;

            string line = "deployment-evidence: " + p.Name + " — " + p.DetailLine.Replace("\r\n", " ", StringComparison.Ordinal)
                .Replace("\n", " ", StringComparison.Ordinal);

            Console.Error.WriteLine("::error::" + line);
        }
    }

    private static int ReadPositiveIntEnv(string name, int fallback)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        if (!int.TryParse(raw.Trim(), out int v) || v < 1)
            return fallback;

        return v;
    }

    private static int ReadNonNegativeIntEnv(string name, int fallback)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        if (!int.TryParse(raw.Trim(), out int v) || v < 0)
            return fallback;

        return v;
    }
}
