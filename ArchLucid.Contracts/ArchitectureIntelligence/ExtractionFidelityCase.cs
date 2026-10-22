using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ExtractionFidelityCase
{
    public string CaseId
    {
        get;
        set;
    } = null!;

    public string SourceText
    {
        get;
        set;
    } = null!;

    private List<ArchitectureElementKind> expectedElementKinds = [];

    public List<ArchitectureElementKind> ExpectedElementKinds
    {
        get => expectedElementKinds;
        set => expectedElementKinds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> expectedNames = [];

    public List<string> ExpectedNames
    {
        get => expectedNames;
        set => expectedNames = ContractCollectionDefaults.Coalesce(value);
    }
}
