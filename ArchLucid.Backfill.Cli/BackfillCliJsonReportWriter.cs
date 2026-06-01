namespace ArchLucid.Backfill.Cli;

/// <summary>Writes Backfill.Cli JSON reports to stdout or a file (TB-090).</summary>
internal static class BackfillCliJsonReportWriter
{
    public static async Task WriteAsync(string json, string? outputPath, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        if (string.IsNullOrWhiteSpace(outputPath))
        {
            Console.WriteLine(json);
            return;
        }

        string fullPath = Path.GetFullPath(outputPath.Trim());
        string? directory = Path.GetDirectoryName(fullPath);

        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        await File.WriteAllTextAsync(fullPath, json, cancellationToken).ConfigureAwait(false);
        Console.WriteLine($"Wrote JSON report to {fullPath}");
    }
}
