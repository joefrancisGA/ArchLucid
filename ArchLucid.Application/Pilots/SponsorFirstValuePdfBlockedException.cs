namespace ArchLucid.Application.Pilots;

/// <summary>Thrown when sponsor PDF export is blocked by persisted proof gates (ROI basis, PilotStrict, or sendability).</summary>
public sealed class SponsorFirstValuePdfBlockedException : Exception
{
    public SponsorFirstValuePdfBlockedException(string message)
        : base(message)
    {
    }

    public SponsorFirstValuePdfBlockedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
