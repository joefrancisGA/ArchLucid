namespace ArchLucid.Cli.Commands;

/// <summary>
///     Working execution door vocabulary for <c>archlucid try</c> (ADR 0086 / AS-083). Aligns CLI flags with UI Record / Practice review types (ADR 0097).
/// </summary>
internal enum TryCommandExecutionDoor
{
    /// <summary>Practice review type — Simulator practice; no Azure OpenAI preflight on the CLI path.</summary>
    Rehearsal,

    /// <summary>Record review type — sealed-record / Real execute intent; explicit opt-in only.</summary>
    Career,
}

internal static class TryCommandExecutionDoorCopy
{
    internal const string CareerDoorLabel = "Record";

    internal const string RehearsalDoorLabel = "Practice";

    internal const string CareerFlagHelp =
        "Record review type — Real execute against a hosted API (maps to `archlucid real-mode smoke`). Local docker bring-up was retired; set ARCHLUCID_REAL_AOAI=1 only when your operator docs still reference the ADR 0033 local gate.";

    internal const string RehearsalFlagHelp =
        "Practice review type — Simulator-friendly smoke (default). Does not require Azure OpenAI keys; forwards to `real-mode smoke --allow-simulator` when smoke flags are present.";

    internal const string DefaultDoorHelp =
        "Default review type is Practice — not Record. Pass --real for the Record / Real path.";

    internal static string LabelFor(TryCommandExecutionDoor door) =>
        door == TryCommandExecutionDoor.Career ? CareerDoorLabel : RehearsalDoorLabel;
}
