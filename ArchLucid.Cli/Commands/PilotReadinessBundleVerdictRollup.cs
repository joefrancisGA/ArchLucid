namespace ArchLucid.Cli.Commands;

internal static class PilotReadinessBundleVerdictRollup
{
    internal static PilotReadinessBundleVerdict FromSlots(IReadOnlyList<PilotReadinessBundleSlotResult> slots)
    {
        ArgumentNullException.ThrowIfNull(slots);

        if (slots.Any(static slot => slot.Verdict == PilotReadinessBundleSlotVerdict.Fail))
            return PilotReadinessBundleVerdict.Fail;

        if (slots.Any(static slot => slot.Verdict == PilotReadinessBundleSlotVerdict.Unknown))
            return PilotReadinessBundleVerdict.Unknown;

        if (slots.Any(static slot => slot.Verdict == PilotReadinessBundleSlotVerdict.Warn))
            return PilotReadinessBundleVerdict.Warn;

        return PilotReadinessBundleVerdict.Pass;
    }
}
