namespace ArchLucid.Backfill.Cli;

/// <summary>Parses <c>--output-json</c> with optional file path (TB-090).</summary>
public static class BackfillCliOutputJsonOptionsParser
{
    public static bool TryParse(string[] args, out bool enabled, out string? outputPath)
    {
        ArgumentNullException.ThrowIfNull(args);

        enabled = false;
        outputPath = null;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            if (!arg.Equals("--output-json", StringComparison.OrdinalIgnoreCase))
                continue;

            enabled = true;

            if (i + 1 < args.Length && !args[i + 1].StartsWith('-'))
                outputPath = args[i + 1];

            return true;
        }

        return false;
    }
}
