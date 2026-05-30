using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Validation;

/// <summary>
///     Coerces live-LLM <see cref="AgentResult" /> rows into merge-safe shape before schema validation.
/// </summary>
public static class AgentResultMergeNormalizer
{
    public static AgentResult Normalize(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        NormalizeFindings(result);
        NormalizeProposedChanges(result);

        return result;
    }

    private static void NormalizeFindings(AgentResult result)
    {
        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
                finding.FindingId = Guid.NewGuid().ToString("N");

            if (finding.SourceAgent == default)
                finding.SourceAgent = result.AgentType;
        }
    }

    private static void NormalizeProposedChanges(AgentResult result)
    {
        if (result.ProposedChanges is null)
            return;

        AgentTopologyProposal proposal = result.ProposedChanges;

        if (string.IsNullOrWhiteSpace(proposal.ProposalId))
            proposal.ProposalId = Guid.NewGuid().ToString("N");

        if (proposal.SourceAgent == default)
            proposal.SourceAgent = result.AgentType;

        proposal.AddedServices ??= [];
        proposal.AddedDatastores ??= [];
        proposal.AddedRelationships ??= [];
        proposal.RequiredControls ??= [];
        proposal.Warnings ??= [];

        foreach (ManifestService service in proposal.AddedServices)
        {
            if (string.IsNullOrWhiteSpace(service.ServiceId))
                service.ServiceId = !string.IsNullOrWhiteSpace(service.ServiceName)
                    ? service.ServiceName.Trim()
                    : Guid.NewGuid().ToString("N");
        }

        foreach (ManifestDatastore datastore in proposal.AddedDatastores)
        {
            if (string.IsNullOrWhiteSpace(datastore.DatastoreId))
                datastore.DatastoreId = !string.IsNullOrWhiteSpace(datastore.DatastoreName)
                    ? datastore.DatastoreName.Trim()
                    : Guid.NewGuid().ToString("N");
        }

        foreach (ManifestRelationship relationship in proposal.AddedRelationships)
        {
            if (string.IsNullOrWhiteSpace(relationship.RelationshipId))
                relationship.RelationshipId = Guid.NewGuid().ToString("N");
        }
    }
}
