using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotReadinessBundleVerdictRollupTests
{
    [Fact]
    public void FromSlots_WhenAnyFail_ReturnsFail()
    {
        IReadOnlyList<PilotReadinessBundleSlotResult> slots =
        [
            BuildSlot(PilotReadinessBundleSlotVerdict.Pass),
            BuildSlot(PilotReadinessBundleSlotVerdict.Fail),
        ];

        PilotReadinessBundleVerdictRollup.FromSlots(slots).Should().Be(PilotReadinessBundleVerdict.Fail);
    }

    [Fact]
    public void FromSlots_WhenAnyUnknownWithoutFail_ReturnsUnknown()
    {
        IReadOnlyList<PilotReadinessBundleSlotResult> slots =
        [
            BuildSlot(PilotReadinessBundleSlotVerdict.Pass),
            BuildSlot(PilotReadinessBundleSlotVerdict.Unknown),
        ];

        PilotReadinessBundleVerdictRollup.FromSlots(slots).Should().Be(PilotReadinessBundleVerdict.Unknown);
    }

    [Fact]
    public void FromSlots_WhenAnyWarnWithoutFailOrUnknown_ReturnsWarn()
    {
        IReadOnlyList<PilotReadinessBundleSlotResult> slots =
        [
            BuildSlot(PilotReadinessBundleSlotVerdict.Pass),
            BuildSlot(PilotReadinessBundleSlotVerdict.Warn),
        ];

        PilotReadinessBundleVerdictRollup.FromSlots(slots).Should().Be(PilotReadinessBundleVerdict.Warn);
    }

    [Fact]
    public void FromSlots_WhenOnlyPassAndSkipped_ReturnsPass()
    {
        IReadOnlyList<PilotReadinessBundleSlotResult> slots =
        [
            BuildSlot(PilotReadinessBundleSlotVerdict.Pass),
            BuildSlot(PilotReadinessBundleSlotVerdict.Skipped),
        ];

        PilotReadinessBundleVerdictRollup.FromSlots(slots).Should().Be(PilotReadinessBundleVerdict.Pass);
    }

    private static PilotReadinessBundleSlotResult BuildSlot(PilotReadinessBundleSlotVerdict verdict) =>
        new()
        {
            SlotKey = "slot",
            DisplayName = "Slot",
            Verdict = verdict,
            Evidence = "evidence",
        };
}
