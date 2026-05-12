namespace ArchLucid.Core.Manifest.Sections;

public class CompliancePostureItem
{
    public string ControlId
    {
        get;
        set;
    } = null!;

    public string ControlName
    {
        get;
        set;
    } = null!;

    public string AppliesToCategory
    {
        get;
        set;
    } = null!;

    public string Status
    {
        get;
        set;
    } = null!;
}
