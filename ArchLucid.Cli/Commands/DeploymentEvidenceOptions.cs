using System.Text.RegularExpressions;

namespace ArchLucid.Cli.Commands;

/// <summary>Parsed arguments for <c>archlucid deployment-evidence</c>.</summary>
internal sealed partial class DeploymentEvidenceOptions
{
    private static readonly Regex SafeEnvironmentToken = SafeEnvRegex();

    internal DeploymentEvidenceOptions(
        string environmentName,
        string apiBaseUrl,
        string? outPath,
        string? repoRoot,
        string syntheticPath,
        bool allowMissingOpenApi)
    {
        EnvironmentName = environmentName;
        ApiBaseUrl = apiBaseUrl;
        OutPath = outPath;
        RepoRoot = repoRoot;
        SyntheticPath = syntheticPath;
        AllowMissingOpenApi = allowMissingOpenApi;
    }

    internal string EnvironmentName
    {
        get;
    }

    internal string ApiBaseUrl
    {
        get;
    }

    internal string? OutPath
    {
        get;
    }

    internal string? RepoRoot
    {
        get;
    }

    internal string SyntheticPath
    {
        get;
    }

    internal bool AllowMissingOpenApi
    {
        get;
    }

    internal static DeploymentEvidenceOptions? Parse(string[] args, out string? error)
    {
        error = null;
        string? environmentName = null;
        string? apiBaseUrl = null;
        string? outPath = null;
        string? repoRoot = null;
        string syntheticPath = "/version";
        bool allowMissingOpenApi = false;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            if (string.Equals(arg, "--allow-missing-openapi", StringComparison.OrdinalIgnoreCase))
            {
                allowMissingOpenApi = true;

                continue;
            }

            if (string.Equals(arg, "--environment", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --environment.";

                    return null;
                }

                environmentName = args[++i];

                continue;
            }

            if (string.Equals(arg, "--api-base-url", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --api-base-url.";

                    return null;
                }

                apiBaseUrl = args[++i];

                continue;
            }

            if (string.Equals(arg, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --out.";

                    return null;
                }

                outPath = args[++i];

                continue;
            }

            if (string.Equals(arg, "--repo", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --repo.";

                    return null;
                }

                repoRoot = args[++i];

                continue;
            }

            if (string.Equals(arg, "--synthetic-path", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --synthetic-path.";

                    return null;
                }

                syntheticPath = NormalizePath(args[++i]);

                continue;
            }

            if (arg.StartsWith('-'))
            {
                error = $"Unexpected argument: {arg}";

                return null;
            }

            error = $"Unexpected positional argument: {arg}";

            return null;
        }

        if (string.IsNullOrWhiteSpace(environmentName))
        {
            error = "Required: --environment <name> (e.g. staging, production, dev).";

            return null;
        }

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            error = "Required: --api-base-url <url> (HTTPS origin for ArchLucid.Api).";

            return null;
        }

        return new DeploymentEvidenceOptions(
            environmentName.Trim(),
            apiBaseUrl.Trim().TrimEnd('/'),
            string.IsNullOrWhiteSpace(outPath) ? null : outPath.Trim(),
            string.IsNullOrWhiteSpace(repoRoot) ? null : repoRoot.Trim(),
            syntheticPath,
            allowMissingOpenApi);
    }

    internal string ResolveDefaultOutPath()
    {
        string slug = SanitizeEnvironmentToken(EnvironmentName);
        string? runId = Environment.GetEnvironmentVariable("GITHUB_RUN_ID");

        if (!string.IsNullOrWhiteSpace(runId))
            return Path.Combine("artifacts", $"deployment-evidence-{slug}-{runId.Trim()}.md");

        return Path.Combine(
            "artifacts",
            $"deployment-evidence-{slug}-{TimeProvider.System.UtcNowDateTime():yyyyMMddTHHmmss}Z.md");
    }

    internal static string SanitizeEnvironmentToken(string environmentName)
    {
        string trimmed = environmentName.Trim().ToLowerInvariant();
        string safe = SafeEnvironmentToken.Replace(trimmed, "-").Trim('-');

        return string.IsNullOrEmpty(safe) ? "env" : safe;
    }

    private static string NormalizePath(string raw)
    {
        string t = raw.Trim();

        if (t.Length == 0)
            return "/version";

        return t.StartsWith("/", StringComparison.Ordinal) ? t : "/" + t;
    }

    [GeneratedRegex("[^a-z0-9\\-]+", RegexOptions.Compiled)]
    private static partial Regex SafeEnvRegex();
}
