namespace ArchLucid.Application.Pilots;

internal static class PilotAgentOutputPilotStrictHonestyCopy
{
    internal const string FailedPlain =
        "**FAILED** — PilotStrict quality gate reported rejecting signals; withhold sponsor-grade real-mode claims until traces pass.";

    internal const string SatisfiedPlain =
        "Satisfied — no PilotStrict trace/faithfulness failures attested for this run.";

    internal static string FormatProofPackageCell(bool agentOutputPilotStrictEvidenceSatisfied) =>
        agentOutputPilotStrictEvidenceSatisfied ? SatisfiedPlain : FailedPlain;

    internal static string FormatSponsorSafeConcreteGapLine() => FailedPlain;
}
