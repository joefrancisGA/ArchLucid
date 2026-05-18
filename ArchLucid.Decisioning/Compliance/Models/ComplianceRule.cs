namespace ArchLucid.Decisioning.Compliance.Models;

public class ComplianceRule
{
    public string RuleId
    {
        get;
        set;
    } = null!;

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

    public string RequiredNodeType
    {
        get;
        set;
    } = null!;

    public string RequiredEdgeType
    {
        get;
        set;
    } = null!;

    public string Severity
    {
        get;
        set;
    } = "Warning";

    /// <summary>Coverage tier: <c>P0</c>, <c>P1</c>, or <c>P2</c> (see governance policy pack priority model).</summary>
    public string Priority
    {
        get;
        set;
    } = "P1";

    public string Description
    {
        get;
        set;
    } = null!;
}
