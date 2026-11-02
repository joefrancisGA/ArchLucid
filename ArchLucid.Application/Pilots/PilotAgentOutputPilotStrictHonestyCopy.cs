using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotAgentOutputPilotStrictHonestyCopy
{
    internal const string FailedPlain =
        "**FAILED** — PilotStrict quality gate reported rejecting signals; withhold sponsor-grade real-mode claims until traces pass.";

    internal const string SatisfiedPlain =
        "Satisfied — no PilotStrict trace/faithfulness failures attested for this run.";

    internal static string FormatSponsorSafeConcreteGapLineWhenUnresolved() =>
        "PilotStrict agent-output signals **not attested** — execution trace query failed; do not treat this run as sponsor-grade real-mode evidence.";

    internal static string FormatProofPackageCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.AgentOutputPilotStrictSignalsResolved)
            return FormatSponsorSafeConcreteGapLineWhenUnresolved();

        return deltas.AgentOutputPilotStrictViolatesSponsorEvidence ? FailedPlain : SatisfiedPlain;
    }

    internal static string FormatProofPackageCell(bool agentOutputPilotStrictEvidenceSatisfied) =>
        agentOutputPilotStrictEvidenceSatisfied ? SatisfiedPlain : FailedPlain;

    internal static string FormatEvidenceCardCell(ProofPackageCompletenessResponse proof, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(proof);
        return FormatProofPackageCell(deltas);
    }

    internal static string FormatEvidenceCardCell(ProofPackageCompletenessResponse proof)
    {
        ArgumentNullException.ThrowIfNull(proof);
        return FormatProofPackageCell(proof.AgentOutputPilotStrictEvidenceSatisfied);
    }

    internal static string FormatSponsorSafeConcreteGapLine() => FailedPlain;
}
