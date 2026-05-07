namespace ArchLucid.Application.Pilots;

/// <summary>Outcome of the buyer-safe gate used by <see cref="FirstValueReportBuilder"/> (Markdown + PDF sibling).</summary>
public sealed record PilotBuyerSafeEvidenceGateResult(
    PilotBuyerSafeEvidencePublishingTier PublishingTier,
    ProofPackageSendability ProofSendability,
    IReadOnlyList<string> DemoGaps,
    IReadOnlyList<string> HardGaps,
    IReadOnlyList<string> SoftGaps)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(DemoGaps, HardGaps, SoftGaps);
    private static byte __ValidatePrimaryConstructorArguments(
        System.Collections.Generic.IReadOnlyList<System.String> demoGaps,
        System.Collections.Generic.IReadOnlyList<System.String> hardGaps,
        System.Collections.Generic.IReadOnlyList<System.String> softGaps)
    {
        ArgumentNullException.ThrowIfNull(demoGaps);
        ArgumentNullException.ThrowIfNull(hardGaps);
        ArgumentNullException.ThrowIfNull(softGaps);
        return (byte)0;
    }
}
