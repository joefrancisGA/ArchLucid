using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Wire contract for agent topology proposals on <see cref="AgentResult.ProposedChanges" />.
/// </summary>
public sealed class AgentTopologyProposal
{
    public string ProposalId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public AgentType SourceAgent
    {
        get;
        set;
    }

    private List<ManifestService> addedServices = [];

    public List<ManifestService> AddedServices
    {
        get => addedServices;
        set => addedServices = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ManifestDatastore> addedDatastores = [];

    public List<ManifestDatastore> AddedDatastores
    {
        get => addedDatastores;
        set => addedDatastores = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ManifestRelationship> addedRelationships = [];

    public List<ManifestRelationship> AddedRelationships
    {
        get => addedRelationships;
        set => addedRelationships = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> requiredControls = [];

    public List<string> RequiredControls
    {
        get => requiredControls;
        set => requiredControls = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> warnings = [];

    public List<string> Warnings
    {
        get => warnings;
        set => warnings = ContractCollectionDefaults.Coalesce(value);
    }
}
