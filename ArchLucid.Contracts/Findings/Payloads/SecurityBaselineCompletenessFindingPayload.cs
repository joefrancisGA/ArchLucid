using ArchLucid.Contracts.Serialization;

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

    private List<string> expectedControlFamilies = [];

    public List<string> ExpectedControlFamilies
    {
        get => expectedControlFamilies;
        set => expectedControlFamilies = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> presentControlFamilies = [];

    public List<string> PresentControlFamilies
    {
        get => presentControlFamilies;
        set => presentControlFamilies = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> missingControlFamilies = [];

    public List<string> MissingControlFamilies
    {
        get => missingControlFamilies;
        set => missingControlFamilies = ContractCollectionDefaults.Coalesce(value);
    }

    private List<SecurityBaselineCompletenessMatrixRowPayload> completenessMatrix = [];

    public List<SecurityBaselineCompletenessMatrixRowPayload> CompletenessMatrix
    {
        get => completenessMatrix;
        set => completenessMatrix = ContractCollectionDefaults.Coalesce(value);
    }
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
