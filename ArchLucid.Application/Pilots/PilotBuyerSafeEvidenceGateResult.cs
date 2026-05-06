namespace ArchLucid.Application.Pilots;

/// <summary>Outcome of the buyer-safe gate used by <see cref="FirstValueReportBuilder"/> (Markdown + PDF sibling).</summary>
public sealed record PilotBuyerSafeEvidenceGateResult(
    PilotBuyerSafeEvidencePublishingTier PublishingTier,
    ProofPackageSendability ProofSendability,
    IReadOnlyList<string> DemoGaps,
    IReadOnlyList<string> HardGaps,
    IReadOnlyList<string> SoftGaps)
{
    private readonly byte __primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(DemoGaps, HardGaps, SoftGaps);
    private static byte __ValidatePrimaryConstructorArguments(
        System.Collections.Generic.IReadOnlyList<System.String> DemoGaps,
        System.Collections.Generic.IReadOnlyList<System.String> HardGaps,
        System.Collections.Generic.IReadOnlyList<System.String> SoftGaps)
    {
        ArgumentNullException.ThrowIfNull(DemoGaps);
        ArgumentNullException.ThrowIfNull(HardGaps);
        ArgumentNullException.ThrowIfNull(SoftGaps);
        return (byte)0;
    }

    /// <summary>Demo then hard then soft gaps — Markdown lists this ordering for sponsor-send review.</summary>
    public IReadOnlyList<string> AllGapsOrdered => DemoGaps.Concat(HardGaps).Concat(SoftGaps).ToList();
}
