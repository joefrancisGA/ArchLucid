using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

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

    public List<ManifestService> AddedServices
    {
        get;
        set;
    } = [];

    public List<ManifestDatastore> AddedDatastores
    {
        get;
        set;
    } = [];

    public List<ManifestRelationship> AddedRelationships
    {
        get;
        set;
    } = [];

    public List<string> RequiredControls
    {
        get;
        set;
    } = [];

    public List<string> Warnings
    {
        get;
        set;
    } = [];
}
