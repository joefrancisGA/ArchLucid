using System.Net.Http.Headers;

namespace ArchLucid.Cli.Commands;

internal static class DataConsistencyCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args.Length is 0 || (args.Length is 1 && (args[0] == "-h" || args[0] == "--help")))
        {
            Console.WriteLine(
                "Usage: archlucid data-consistency orphans [--api-base-url <url>]\n"
                + "       archlucid data-consistency remediate <comparison-records|golden-manifests|findings-snapshots> "
                + "[--execute] [--max-rows <n>] [--api-base-url <url>]\n"
                + "Requires ARCHLUCID_API_KEY with admin authority. Remediate defaults to dry-run unless --execute.");

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        bool execute = args.Contains("--execute", StringComparer.Ordinal);
        string? apiOverride = OptionalStringAfter(args, "--api-base-url");
        string effectiveBase = string.IsNullOrWhiteSpace(apiOverride) ? baseUrl : apiOverride.Trim().TrimEnd('/');

        using HttpClient http = new();
        http.Timeout = TimeSpan.FromMinutes(2);
        http.BaseAddress = new Uri(effectiveBase + "/");
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
            Console.WriteLine("Warning: ARCHLUCID_API_KEY is not set; admin routes will return 401.");

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            http.DefaultRequestHeaders.Remove("X-Api-Key");
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        }

        string sub = args[0];

        if (string.Equals(sub, "orphans", StringComparison.OrdinalIgnoreCase))

            return await GetOrphansAsync(http, cancellationToken);

        if (!string.Equals(sub, "remediate", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine("Unknown subcommand. Use: orphans | remediate");

            return CliExitCode.UsageError;
        }

        if (args.Length < 2)
        {
            Console.WriteLine("remediate requires a target: comparison-records | golden-manifests | findings-snapshots");

            return CliExitCode.UsageError;
        }

        int maxRows = 50;
        string? mr = OptionalStringAfter(args, "--max-rows");

        if (mr is not null && int.TryParse(mr, out int parsed) && parsed > 0)
            maxRows = Math.Min(parsed, 500);

        string target = args[1];

        if (string.Equals(target, "comparison-records", StringComparison.OrdinalIgnoreCase))

            return await PostRemediateAsync(
                http,
                $"v1/admin/diagnostics/data-consistency/orphan-comparison-records?dryRun={(!execute).ToString().ToLowerInvariant()}&maxRows={maxRows}",
                cancellationToken);

        if (string.Equals(target, "golden-manifests", StringComparison.OrdinalIgnoreCase))

            return await PostRemediateAsync(
                http,
                $"v1/admin/diagnostics/data-consistency/orphan-golden-manifests?dryRun={(!execute).ToString().ToLowerInvariant()}&maxRows={maxRows}",
                cancellationToken);

        if (string.Equals(target, "findings-snapshots", StringComparison.OrdinalIgnoreCase))

            return await PostRemediateAsync(
                http,
                $"v1/admin/diagnostics/data-consistency/orphan-findings-snapshots?dryRun={(!execute).ToString().ToLowerInvariant()}&maxRows={maxRows}",
                cancellationToken);

        Console.WriteLine("Unknown remediate target.");

        return CliExitCode.UsageError;
    }

    private static async Task<int> GetOrphansAsync(HttpClient http, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response =
            await http.GetAsync("v1/admin/diagnostics/data-consistency/orphans", cancellationToken);

        string text = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine($"Error {(int)response.StatusCode}: {text}");

            return CliExitCode.OperationFailed;
        }

        Console.WriteLine(text);

        return CliExitCode.Success;
    }

    private static async Task<int> PostRemediateAsync(HttpClient http, string path, CancellationToken cancellationToken)
    {
        using HttpRequestMessage req = new(HttpMethod.Post, path);
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        using HttpResponseMessage response = await http.SendAsync(req, cancellationToken);
        string body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine($"Error {(int)response.StatusCode}: {body}");

            return CliExitCode.OperationFailed;
        }

        Console.WriteLine(body);

        return CliExitCode.Success;
    }

    private static string? OptionalStringAfter(string[] args, string flag)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (string.Equals(args[i], flag, StringComparison.OrdinalIgnoreCase))
                return args[i + 1];
        }

        return null;
    }
}
