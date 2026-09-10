namespace ArchLucid.Cli.Commands;

/// <summary>
///     Working execution door vocabulary for <c>archlucid try</c> (ADR 0086 / AS-083). Aligns CLI flags with UI Career / Rehearsal doors.
/// </summary>
internal enum TryCommandExecutionDoor
{
    /// <summary>Rehearsal door — Simulator practice; no Azure OpenAI preflight on the CLI path.</summary>
    Rehearsal,

    /// <summary>Career door — sealed-record / Real execute intent; explicit opt-in only.</summary>
    Career,
}

internal static class TryCommandExecutionDoorCopy
{
    internal const string CareerDoorLabel = "Career";

    internal const string RehearsalDoorLabel = "Rehearsal";

    internal const string CareerFlagHelp =
        "Career door — Real execute against a hosted API (maps to `archlucid real-mode smoke`). Local docker bring-up was retired; set ARCHLUCID_REAL_AOAI=1 only when your operator docs still reference the ADR 0033 local gate.";

    internal const string RehearsalFlagHelp =
        "Rehearsal door — Simulator-friendly smoke (default). Does not require Azure OpenAI keys; forwards to `real-mode smoke --allow-simulator` when smoke flags are present.";

    internal const string DefaultDoorHelp =
        "Default door is Rehearsal (practice) — not Career. Pass --real for the Career / Real path.";

    internal static string LabelFor(TryCommandExecutionDoor door) =>
        door == TryCommandExecutionDoor.Career ? CareerDoorLabel : RehearsalDoorLabel;
}
