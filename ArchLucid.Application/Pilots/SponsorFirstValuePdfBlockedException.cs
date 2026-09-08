namespace ArchLucid.Application.Pilots;

/// <summary>Thrown when sponsor PDF export is blocked by persisted proof gates (ROI basis, PilotStrict, or sendability).</summary>
public sealed class SponsorFirstValuePdfBlockedException : Exception
{
    public SponsorFirstValuePdfBlockedException(string message, string? blockReasonCode = null)
        : base(message)
    {
        BlockReasonCode = blockReasonCode;
    }

    public SponsorFirstValuePdfBlockedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public string? BlockReasonCode { get; }
}
