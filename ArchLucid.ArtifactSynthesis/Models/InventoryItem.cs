namespace ArchLucid.ArtifactSynthesis.Models;

public class InventoryItem
{
    public string Category
    {
        get;
        set;
    } = null!;

    public string Name
    {
        get;
        set;
    } = null!;

    public string Status
    {
        get;
        set;
    } = null!;

    public string Notes
    {
        get;
        set;
    } = null!;

    public string? ControlId
    {
        get;
        set;
    }

    public bool? IsMandatory
    {
        get;
        set;
    }

    public string? IssueType
    {
        get;
        set;
    }

    public List<string>? SupportingFindingIds
    {
        get;
        set;
    }
}
