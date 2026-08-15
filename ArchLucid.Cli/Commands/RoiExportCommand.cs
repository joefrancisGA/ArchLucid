using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP integration; covered by command-line tests.")]
internal static class RoiExportCommand
{
    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? outputPath = CliCommandShared.TryGetOptionValue(args, "--out");

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);

        using HttpResponseMessage response = await http.GetAsync("v1/roi/sponsor-report/export", cancellationToken);
        string text = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            await WriteErrorAsync("api_error", $"Error {(int)response.StatusCode}: {text}");

            return CliExitCode.OperationFailed;
        }

        SponsorRoiExportResponse? export = JsonSerializer.Deserialize<SponsorRoiExportResponse>(
            text,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (export is null)
        {
            await WriteErrorAsync("deserialize_error", "Sponsor ROI export response was empty.");

            return CliExitCode.OperationFailed;
        }

        string csv = BuildCsv(export);
        string targetPath = outputPath ?? BuildDefaultOutputPath();

        await File.WriteAllTextAsync(targetPath, csv, Encoding.UTF8, cancellationToken);

        if (CliExecutionContext.JsonOutput)
        {
            object payload = new
            {
                ok = true,
                outputPath = targetPath,
                rowCount = export.Rows.Count,
                environmentSliceCount = export.SavingsByEnvironment.Count
            };

            Console.WriteLine(JsonSerializer.Serialize(payload));
        }
        else
        {
            Console.WriteLine($"Wrote {export.Rows.Count} row(s) to {targetPath}");
        }

        return CliExitCode.Success;
    }

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid roi export [--out <file.csv>] [--api-base-url <url>]";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    internal static string BuildCsv(SponsorRoiExportResponse export)
    {
        StringBuilder sb = new();
        sb.AppendLine("FindingId,RunId,SystemName,Environment,Category,Severity,Title,AffectedResource,EstimatedUsdSavings");

        foreach (SponsorRoiExportRow row in export.Rows)
        {
            sb.Append(CsvEscape(row.FindingId)).Append(',')
                .Append(CsvEscape(row.RunId)).Append(',')
                .Append(CsvEscape(row.SystemName)).Append(',')
                .Append(CsvEscape(row.Environment)).Append(',')
                .Append(CsvEscape(row.Category)).Append(',')
                .Append(CsvEscape(row.Severity)).Append(',')
                .Append(CsvEscape(row.Title)).Append(',')
                .Append(CsvEscape(row.AffectedResource ?? string.Empty)).Append(',')
                .Append(row.EstimatedUsdSavings?.ToString(CultureInfo.InvariantCulture) ?? string.Empty)
                .AppendLine();
        }

        if (export.SavingsByEnvironment.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("Environment,EstimatedUsdSavings");

            foreach (SponsorRoiEnvironmentSavingsSlice slice in export.SavingsByEnvironment)
            {
                sb.Append(CsvEscape(slice.Environment)).Append(',')
                    .Append(slice.EstimatedUsdSavings.ToString(CultureInfo.InvariantCulture))
                    .AppendLine();
            }
        }

        return sb.ToString();
    }

    private static string BuildDefaultOutputPath()
    {
        string stamp = TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);

        return Path.Combine(Directory.GetCurrentDirectory(), $"sponsor-roi-export-{stamp}.csv");
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
