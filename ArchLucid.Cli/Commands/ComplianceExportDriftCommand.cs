using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP integration; covered by command-line tests.")]
internal static class ComplianceExportDriftCommand
{
    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? startDateRaw = CliCommandShared.TryGetOptionValue(args, "--start-date");
        string? endDateRaw = CliCommandShared.TryGetOptionValue(args, "--end-date");
        string? outputPath = CliCommandShared.TryGetOptionValue(args, "--out");
        string format = CliCommandShared.TryGetOptionValue(args, "--format")?.Trim().ToLowerInvariant() ?? "csv";

        if (string.IsNullOrWhiteSpace(startDateRaw) || string.IsNullOrWhiteSpace(endDateRaw))
        {
            WriteUsage();

            return CliExitCode.UsageError;
        }

        if (!DateTime.TryParse(startDateRaw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out DateTime startUtc)
            || !DateTime.TryParse(endDateRaw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out DateTime endUtc))
        {
            await WriteErrorAsync("invalid_date", "Expected --start-date and --end-date in ISO-8601 UTC format.");

            return CliExitCode.UsageError;
        }

        if (startUtc >= endUtc)
        {
            await WriteErrorAsync("invalid_range", "start-date must be before end-date.");

            return CliExitCode.UsageError;
        }

        string query =
            $"v1/governance/compliance-drift-trend?fromUtc={Uri.EscapeDataString(startUtc.ToString("O", CultureInfo.InvariantCulture))}"
            + $"&toUtc={Uri.EscapeDataString(endUtc.ToString("O", CultureInfo.InvariantCulture))}"
            + "&bucketMinutes=1440";

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);

        using HttpResponseMessage response = await http.GetAsync(query, cancellationToken);
        string text = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            await WriteErrorAsync("api_error", $"Error {(int)response.StatusCode}: {text}");

            return CliExitCode.OperationFailed;
        }

        List<ComplianceDriftTrendPoint>? points = JsonSerializer.Deserialize<List<ComplianceDriftTrendPoint>>(
            text,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        points ??= [];

        string report = format == "md"
            ? BuildMarkdown(points, startUtc, endUtc)
            : BuildCsv(points);

        string targetPath = outputPath ?? BuildDefaultOutputPath(format);

        await File.WriteAllTextAsync(targetPath, report, Encoding.UTF8, cancellationToken);

        if (CliExecutionContext.JsonOutput)
        {
            object payload = new
            {
                ok = true,
                outputPath = targetPath,
                bucketCount = points.Count,
                format
            };

            Console.WriteLine(JsonSerializer.Serialize(payload));
        }
        else
        {
            Console.WriteLine($"Wrote {points.Count} bucket(s) to {targetPath}");
        }

        return CliExitCode.Success;
    }

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid compliance export-drift --start-date <utc> --end-date <utc> "
            + "[--format csv|md] [--out <path>] [--api-base-url <url>]";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    internal static string BuildCsv(IReadOnlyList<ComplianceDriftTrendPoint> points)
    {
        StringBuilder sb = new();
        sb.AppendLine("BucketUtc,ChangeCount,OpenFindingsCount,ResolvedFindingsCount,ChangesByType");

        foreach (ComplianceDriftTrendPoint point in points)
        {
            string changesByType = string.Join(
                ';',
                point.ChangesByType.OrderBy(static kv => kv.Key, StringComparer.Ordinal)
                    .Select(static kv => $"{kv.Key}={kv.Value}"));

            sb.Append(point.BucketUtc.ToString("O", CultureInfo.InvariantCulture)).Append(',')
                .Append(point.ChangeCount).Append(',')
                .Append(point.OpenFindingsCount).Append(',')
                .Append(point.ResolvedFindingsCount).Append(',')
                .Append(CsvEscape(changesByType))
                .AppendLine();
        }

        return sb.ToString();
    }

    internal static string BuildMarkdown(
        IReadOnlyList<ComplianceDriftTrendPoint> points,
        DateTime startUtc,
        DateTime endUtc)
    {
        StringBuilder sb = new();
        sb.AppendLine("# Compliance drift report");
        sb.AppendLine();
        sb.AppendLine($"- **From (UTC):** {startUtc:O}");
        sb.AppendLine($"- **To (UTC):** {endUtc:O}");
        sb.AppendLine($"- **Generated (UTC):** {TimeProvider.System.GetUtcNow():O}");
        sb.AppendLine();
        sb.AppendLine("| Day (UTC) | Policy changes | Open findings | Resolved findings |");
        sb.AppendLine("|-----------|----------------|---------------|-------------------|");

        foreach (ComplianceDriftTrendPoint point in points)
        {
            sb.Append("| ")
                .Append(point.BucketUtc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
                .Append(" | ")
                .Append(point.ChangeCount)
                .Append(" | ")
                .Append(point.OpenFindingsCount)
                .Append(" | ")
                .Append(point.ResolvedFindingsCount)
                .AppendLine(" |");
        }

        return sb.ToString();
    }

    private static string BuildDefaultOutputPath(string format)
    {
        string stamp = TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
        string extension = format == "md" ? "md" : "csv";

        return Path.Combine(Directory.GetCurrentDirectory(), $"compliance-drift-{stamp}.{extension}");
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n') || value.Contains('\r'))
            return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";

        return value;
    }

    private static async Task WriteErrorAsync(string code, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.OperationFailed, code, message);
        else
            await Console.Error.WriteLineAsync(message);
    }
}
