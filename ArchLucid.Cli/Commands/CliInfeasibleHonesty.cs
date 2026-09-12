namespace ArchLucid.Cli.Commands;

/// <summary>LN-023 — stdout/help honesty for hard vs soft infeasible on CLI export paths.</summary>
internal static class CliInfeasibleHonesty
{
    internal const string HardRequiresCitationLine =
        "Hard infeasible: requires a law, theorem, or invariant contradiction citation before Career export (ADR 0093 / LN-004).";

    internal const string SoftEnvelopeLine =
        "Soft infeasible: labeled envelope — not Career-complete without sealed run stamp (CG).";

    internal const string UncitedHardRefusalLine =
        "Refusing to label output Career-hard when hard infeasible lacks citation.";

    internal const string ExitNotCareerCompleteLine =
        "Exit codes and JSON fields must not claim Career-complete when hard citation or soft envelope honesty fails.";

    internal static void WriteHelp()
    {
        Console.WriteLine("archlucid infeasible honesty — hard vs soft infeasibility rules (LN-023).");
        Console.WriteLine();
        Console.WriteLine("Usage: archlucid infeasible honesty [--json]");
        Console.WriteLine();
        Console.WriteLine($"  {HardRequiresCitationLine}");
        Console.WriteLine($"  {SoftEnvelopeLine}");
        Console.WriteLine($"  {UncitedHardRefusalLine}");
        Console.WriteLine($"  {ExitNotCareerCompleteLine}");
    }
}
