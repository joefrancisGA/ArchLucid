using System.Globalization;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared LLM-call count copy for markdown deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasLlmCallCountFormatter
{
    internal const string ZeroSimulatorCaveatPlain =
        "zero may be valid when simulator substitution applies — see execution mode / quality disposition";

    internal static string FormatMarkdownTableCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.LlmCallCountResolved)
            return "_(not attested — execution trace query failed)_";

        if (deltas.LlmCallCount == 0)
            return $"0 _({ZeroSimulatorCaveatPlain})_";

        return deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture);
    }

    internal static string FormatPlainText(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.LlmCallCountResolved)
            return "(not attested — execution trace query failed)";

        if (deltas.LlmCallCount == 0)
            return $"0 ({ZeroSimulatorCaveatPlain})";

        return deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture);
    }
}
