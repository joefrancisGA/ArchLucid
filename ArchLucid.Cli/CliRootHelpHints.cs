namespace ArchLucid.Cli;

/// <summary>
///     Discoverability hints printed with root-level CLI help (stderr-safe for JSON / piping).
/// </summary>
internal static class CliRootHelpHints
{
    internal const string TryPilotLoopBanner =
        "New here? Set ARCHLUCID_API_URL to your hosted API, then run `archlucid trial smoke --staging ...` or `archlucid second-run <file>`.";

    internal static void WriteTryPilotLoopBanner(TextWriter? stderr = null)
    {
        (stderr ?? Console.Error).WriteLine(TryPilotLoopBanner);
    }
}
