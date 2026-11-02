using System.Globalization;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared LLM-call count copy for markdown deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasLlmCallCountFormatter
{
    internal const string NotAttestedPlain = "not attested — execution trace query failed";

    internal const string ZeroSimulatorCaveatPlain =
        "zero may be valid when simulator substitution applies — see execution mode / quality disposition";

    internal static string FormatMarkdownTableCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.LlmCallCountResolved)
            return FormattableString.Invariant($"_({NotAttestedPlain})_");

        if (deltas.LlmCallCount == 0)
            return $"0 _({ZeroSimulatorCaveatPlain})_";

        return deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture);
    }

    internal static string FormatPlainText(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.LlmCallCountResolved)
            return FormattableString.Invariant($"({NotAttestedPlain})");

        if (deltas.LlmCallCount == 0)
            return $"0 ({ZeroSimulatorCaveatPlain})";

        return deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture);
    }

    internal static string FormatSponsorSafeConcreteGapLine() =>
        FormattableString.Invariant(
            $"**LLM-call count** _({NotAttestedPlain})_ — the displayed integer is not trustworthy evidence.");

    internal static string FormatProofPackageCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);

        if (!deltas.LlmCallCountResolved)
            return FormatMarkdownTableCell(deltas);

        string countDisplay =
            FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture));

        if (deltas.LlmCallCount == 0)
        {
            return
                $"{countDisplay} row(s) in execution traces ({ZeroSimulatorCaveatPlain}).";
        }

        return $"{countDisplay} row(s) in execution traces.";
    }
}
