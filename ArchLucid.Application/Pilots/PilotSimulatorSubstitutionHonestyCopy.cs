namespace ArchLucid.Application.Pilots;

internal static class PilotSimulatorSubstitutionHonestyCopy
{
    internal const string ConcreteGapPlain =
        "**Simulator substitution is recorded on the run** — disclose before any sponsor conversation implies live-model spend or production agent execution.";

    internal static string FormatSponsorSafeConcreteGapLine() => ConcreteGapPlain;

    internal static string FormatExecutionModeBlockquoteLine() => ConcreteGapPlain;

    internal static string AppendToProofPackageEvidenceBasisCell(string evidenceBasisLabelsCell) =>
        string.IsNullOrEmpty(evidenceBasisLabelsCell)
            ? ConcreteGapPlain
            : FormattableString.Invariant($"{evidenceBasisLabelsCell}; {ConcreteGapPlain}");
}
