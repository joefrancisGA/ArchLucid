using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureIntelligenceDeepCase
{
    public string CaseId
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string SourceText
    {
        get;
        set;
    } = string.Empty;

    private List<PlantedDefectExpectation> plantedDefects = [];

    public List<PlantedDefectExpectation> PlantedDefects
    {
        get => plantedDefects;
        set => plantedDefects = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> expectedMutationIds = [];

    public List<string> ExpectedMutationIds
    {
        get => expectedMutationIds;
        set => expectedMutationIds = ContractCollectionDefaults.Coalesce(value);
    }
}
