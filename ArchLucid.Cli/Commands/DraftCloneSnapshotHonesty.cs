namespace ArchLucid.Cli.Commands;

/// <summary>SN-036 — stdout/help honesty for spawn-locked clone (SN-008 / ADR 0092 / CG-062 / CG-021).</summary>
internal static class DraftCloneSnapshotHonesty
{
    internal const string CommandSummary =
        "Start a new editable draft from a spawn-locked snapshot (architecture sketch path).";

    internal const string CareerRehearsalRuleLine =
        "Career/Rehearsal: the clone is an architecture sketch (ADR 0092) until you submit a Record review. "
        + "Start-review stamps your Working Career or Rehearsal door on the new run (CG-062).";

    internal const string SimulatorCareerBlockLine =
        "Record on Simulator host Mode cannot produce unlabeled sealed-record proof (CG-021). "
        + "Use Practice (Rehearsal) door or Real execute before you treat output as career-complete.";

    internal const string CasPatchReminderLine =
        "Lost-write CAS: clone-snapshot does not PATCH. When you patch drafts from the CLI, send ExpectedUpdatedUtc from the last GET/PATCH response (LW).";

    internal static void WriteHelp()
    {
        Console.WriteLine("archlucid draft clone-snapshot — new version from a spawn-locked draft (SN-008 / WA-10).");
        Console.WriteLine();
        Console.WriteLine("Usage: archlucid draft clone-snapshot <draftId> [--json]");
        Console.WriteLine();
        Console.WriteLine($"  {CommandSummary}");
        Console.WriteLine($"  {CareerRehearsalRuleLine}");
        Console.WriteLine($"  {SimulatorCareerBlockLine}");
        Console.WriteLine($"  {CasPatchReminderLine}");
    }

    internal static async Task WriteStdoutBannerAsync(TextWriter output, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(output);

        await output.WriteLineAsync(CareerRehearsalRuleLine);
        await output.WriteLineAsync(SimulatorCareerBlockLine);
        await output.WriteLineAsync(CasPatchReminderLine);
        await output.WriteLineAsync(string.Empty);
    }
}
