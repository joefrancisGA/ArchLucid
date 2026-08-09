using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Cross-surface execution-mode honesty invariants (INV-002 / TB-971). Never promote Mixed, Fallback, or Simulator to Real.
/// </summary>
public static class StructuralExecutionModeHonesty
{
    /// <summary>
    ///     ROI history <c>IsMixedMode</c> footnote — period mix across runs; not the within-run <see cref="StructuralExecutionMode.Mixed" /> label.
    /// </summary>
    public const string RoiPeriodMixedModeFootnote =
        "Chart includes both Real and Simulator runs across this reporting period. "
        + "This footnote describes period mix, not whether any single review package was Mixed within-run.";

    /// <summary>True only when persisted run mode is unqualified Real (buyer evidence path).</summary>
    public static bool IsBuyerRealEvidenceMode(StructuralExecutionMode mode) =>
        mode == StructuralExecutionMode.Real;

    /// <summary>Display labels must match persisted mode — never upgrade non-Real modes to Real copy.</summary>
    public static bool DisplayLabelMatchesPersistedMode(StructuralExecutionMode mode, string displayLabel)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayLabel);

        string expected = StructuralExecutionModeLabels.ToDisplayLabel(mode);

        return string.Equals(displayLabel.Trim(), expected, StringComparison.Ordinal);
    }

    /// <summary>Conservative trust posture: only explicit Real counts as a live-model run.</summary>
    public static bool ShouldTreatRunAsLiveModel(StructuralExecutionMode? mode) =>
        mode == StructuralExecutionMode.Real;
}
