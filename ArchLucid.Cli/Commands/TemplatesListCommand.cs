using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Lists built-in context-ingestion JSON templates from <c>templates/context-ingestion/</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin filesystem walk; covered by CLI integration test.")]
internal static class TemplatesListCommand
{
    public static Task<int> RunAsync(string[] args)
    {
        string? repoRoot = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (!string.Equals(args[i], "--repo-root", StringComparison.OrdinalIgnoreCase))
                continue;

            if (i + 1 >= args.Length)
            {
                Console.Error.WriteLine("Expected: archlucid templates list [--repo-root <dir>]");

                return Task.FromResult(CliExitCode.UsageError);
            }

            repoRoot = args[i + 1].Trim();
            break;
        }

        string? resolved = string.IsNullOrWhiteSpace(repoRoot)
            ? CliRepositoryRootResolver.TryResolveRepositoryRoot()
            : Path.GetFullPath(repoRoot.Trim());

        if (string.IsNullOrWhiteSpace(resolved) || !Directory.Exists(resolved))
        {
            Console.Error.WriteLine(
                "Could not locate the ArchLucid repository root (expected docs/go-to-market/MARKETPLACE_PUBLICATION.md marker). "
                + "Run from the repo clone or pass --repo-root <dir>.");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string dir = Path.Combine(resolved, "templates", "context-ingestion");

        if (!Directory.Exists(dir))
        {
            Console.Error.WriteLine($"Templates directory not found: {dir}");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string[] files = Directory.GetFiles(dir, "*.json", SearchOption.TopDirectoryOnly)
            .OrderBy(static f => f, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (files.Length == 0)
        {
            Console.WriteLine("(no *.json templates)");

            return Task.FromResult(CliExitCode.Success);
        }

        if (CliExecutionContext.JsonOutput)
        {
            List<object> rows = [];

            foreach (string filePath in files)
            {
                rows.Add(BuildRow(filePath));
            }

            CliJson.WriteSuccessLine(Console.Out, new { ok = true, templates = rows });

            return Task.FromResult(CliExitCode.Success);
        }

        foreach (string filePath in files)
        {
            TemplateListRow row = BuildRow(filePath);
            Console.WriteLine($"{row.FileName}\t{row.SystemName}\t{row.DescriptionOneLine}");
        }

        return Task.FromResult(CliExitCode.Success);
    }

    private static TemplateListRow BuildRow(string filePath)
    {
        string fileName = Path.GetFileName(filePath);
        string systemName = fileName;
        string description = "";

        try
        {
            ReadOnlySpan<byte> utf8 = File.ReadAllBytes(filePath);
            using JsonDocument doc = JsonDocument.Parse(utf8);

            if (doc.RootElement.TryGetProperty("systemName", out JsonElement sn))
                systemName = sn.GetString()?.Trim() ?? systemName;

            if (doc.RootElement.TryGetProperty("description", out JsonElement d))
                description = d.GetString()?.Trim() ?? "";
        }
        catch (Exception)
        {
            description = "(could not parse JSON metadata)";
        }

        return new TemplateListRow(fileName, systemName, CompactDescription(description));
    }

    private static string CompactDescription(string description)
    {
        string oneLine = description.Replace('\r', ' ').Replace('\n', ' ').Trim();

        if (oneLine.Length <= 120)
            return oneLine;

        return oneLine[..117] + "...";
    }

    private sealed record TemplateListRow(string FileName, string SystemName, string DescriptionOneLine);
}
