namespace ArchiForge.Application.Summaries;

public sealed class ManifestSummaryOptions
{
    public static ManifestSummaryOptions Default { get; } = new();

    public bool IncludeRequiredControls { get; set; } = true;

    public bool IncludeComponentControls { get; set; } = true;

    public bool IncludeTags { get; set; } = true;

    public bool IncludeRelationships { get; set; } = true;

    public int? MaxRelationships { get; set; }

    public bool IncludeComplianceTags { get; set; } = true;
}

