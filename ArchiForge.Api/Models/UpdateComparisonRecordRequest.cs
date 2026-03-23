namespace ArchiForge.Api.Models;

public sealed class UpdateComparisonRecordRequest
{
    /// <summary>Optional short label (e.g. release-1.2, incident-42). Pass null to leave unchanged; pass empty string to clear.</summary>
    public string? Label
    {
        get; set;
    }

    /// <summary>Optional tags. Pass null to leave unchanged; pass empty list to clear all tags.</summary>
    public List<string>? Tags
    {
        get; set;
    }
}
