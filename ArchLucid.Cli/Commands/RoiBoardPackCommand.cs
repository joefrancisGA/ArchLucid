using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Text;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP integration; covered by command-line tests.")]
internal static class RoiBoardPackCommand
{
    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string format = TryGetFormat(args) ?? "md";
        string? outputPath = CliCommandShared.TryGetOptionValue(args, "--out");

        if (!TryNormalizeFormat(format, out string queryFormat, out bool isPdf))
        {
            await WriteErrorAsync("invalid_format", "Format must be md or pdf.");

            return CliExitCode.UsageError;
        }

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);

        using HttpResponseMessage response = await http.GetAsync(
            $"v1/roi/executive-summary/board-pack?format={queryFormat}",
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string text = await response.Content.ReadAsStringAsync(cancellationToken);
            await WriteErrorAsync("api_error", $"Error {(int)response.StatusCode}: {text}");

            return CliExitCode.OperationFailed;
        }

        string targetPath = outputPath ?? BuildDefaultOutputPath(isPdf);

        if (isPdf)
        {
            byte[] bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            await File.WriteAllBytesAsync(targetPath, bytes, cancellationToken);
        }
        else
        {
            string markdown = await response.Content.ReadAsStringAsync(cancellationToken);
            await File.WriteAllTextAsync(targetPath, markdown, Encoding.UTF8, cancellationToken);
        }

        if (CliExecutionContext.JsonOutput)
        {
            object payload = new
            {
                ok = true,
                outputPath = targetPath,
                format = queryFormat
            };

            Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(payload));
        }
        else
        {
            Console.WriteLine($"Wrote board pack ({queryFormat}) to {targetPath}");
        }

        return CliExitCode.Success;
    }

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid roi board-pack [--format md|pdf] [--out <path>] [--api-base-url <url>]";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    private static string? TryGetFormat(string[] args)
    {
        string? value = CliCommandShared.TryGetOptionValue(args, "--format");

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static bool TryNormalizeFormat(string format, out string queryFormat, out bool isPdf)
    {
        queryFormat = format.Trim().ToLowerInvariant();
        isPdf = false;

        if (queryFormat is "md" or "markdown")
        {
            queryFormat = "md";

            return true;
        }

        if (queryFormat is "pdf")
        {
            isPdf = true;

            return true;
        }

        return false;
    }

    private static string BuildDefaultOutputPath(bool isPdf)
    {
        string stamp = TimeProvider.System.GetUtcNow().UtcDateTime.ToString("yyyyMMdd-HHmmss", System.Globalization.CultureInfo.InvariantCulture);
        string extension = isPdf ? "pdf" : "md";

        return Path.Combine(Directory.GetCurrentDirectory(), $"executive-roi-board-pack-{stamp}.{extension}");
    }

    private static async Task WriteErrorAsync(string code, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.OperationFailed, code, message);
        else
            await Console.Error.WriteLineAsync(message);
    }
}
