namespace ArchLucid.Cli;

/// <summary>
///     Discoverability hints printed with root-level CLI help (stderr-safe for JSON / piping).
/// </summary>
internal static class CliRootHelpHints
{
    internal const string TryPilotLoopBanner =
        "New here? Run `archlucid try` for a one-shot pilot loop.";

    internal static void WriteTryPilotLoopBanner(TextWriter? stderr = null)
    {
        (stderr ?? Console.Error).WriteLine(TryPilotLoopBanner);
    }
}
