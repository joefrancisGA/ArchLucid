namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>Expected planted defect for golden/deep-case scoring (TB-1988 / TB-1990).</summary>
public class PlantedDefectExpectation
{
    public string DefectId
    {
        get;
        set;
    } = string.Empty;

    public string TitlePattern
    {
        get;
        set;
    } = string.Empty;

    public QualityDimension Dimension
    {
        get;
        set;
    }

    public string MinSeverity
    {
        get;
        set;
    } = "High";
}
