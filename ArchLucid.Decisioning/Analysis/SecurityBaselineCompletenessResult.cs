namespace ArchLucid.Decisioning.Analysis;

public sealed class SecurityBaselineCompletenessMatrixRow
{
    public string ControlFamily
    {
        get;
        init;
    } = string.Empty;

    public bool Expected
    {
        get;
        init;
    }

    public bool Present
    {
        get;
        init;
    }
}

public sealed class SecurityBaselineCompletenessResult
{
    public int TopologyNodeCount
    {
        get;
        init;
    }

    public int SecurityNodeCount
    {
        get;
        init;
    }

    public List<string> ExpectedControlFamilies
    {
        get;
        init;
    } = [];

    public List<string> PresentControlFamilies
    {
        get;
        init;
    } = [];

    public List<string> MissingControlFamilies
    {
        get;
        init;
    } = [];

    public List<SecurityBaselineCompletenessMatrixRow> CompletenessMatrix
    {
        get;
        init;
    } = [];
}
