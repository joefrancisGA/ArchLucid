namespace ArchLucid.Contracts.Findings.Payloads;

public class SecurityBaselineCompletenessFindingPayload
{
    public int TopologyNodeCount
    {
        get;
        set;
    }

    public int SecurityNodeCount
    {
        get;
        set;
    }

    public List<string> ExpectedControlFamilies
    {
        get;
        set;
    } = [];

    public List<string> PresentControlFamilies
    {
        get;
        set;
    } = [];

    public List<string> MissingControlFamilies
    {
        get;
        set;
    } = [];

    public List<SecurityBaselineCompletenessMatrixRowPayload> CompletenessMatrix
    {
        get;
        set;
    } = [];
}

public class SecurityBaselineCompletenessMatrixRowPayload
{
    public string ControlFamily
    {
        get;
        set;
    } = string.Empty;

    public bool Expected
    {
        get;
        set;
    }

    public bool Present
    {
        get;
        set;
    }
}
