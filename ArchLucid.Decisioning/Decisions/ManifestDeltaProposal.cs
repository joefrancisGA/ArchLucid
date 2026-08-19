using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Decisions;

/// <summary>
///     Merge-domain proposal shape used internally by the decision engine.
/// </summary>
public sealed class ManifestDeltaProposal
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
