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

        // Repair services: cross-fill name ↔ id, then drop only if both are empty.
        // The schema requires serviceName minLength: 1. When only one field is present, derive the other.
        foreach (ManifestService service in proposal.AddedServices)
        {
            bool hasName = !string.IsNullOrWhiteSpace(service.ServiceName);
            bool hasId = !string.IsNullOrWhiteSpace(service.ServiceId);

            if (hasName && !hasId)
                service.ServiceId = service.ServiceName.Trim();
            else if (!hasName && hasId)
                service.ServiceName = service.ServiceId.Trim();
        }

        proposal.AddedServices = proposal.AddedServices
            .Where(s => !string.IsNullOrWhiteSpace(s.ServiceName))
            .ToList();

        // Repair datastores: cross-fill name ↔ id, then drop only if both are empty.
        foreach (ManifestDatastore datastore in proposal.AddedDatastores)
        {
            bool hasName = !string.IsNullOrWhiteSpace(datastore.DatastoreName);
            bool hasId = !string.IsNullOrWhiteSpace(datastore.DatastoreId);

            if (hasName && !hasId)
                datastore.DatastoreId = datastore.DatastoreName.Trim();
            else if (!hasName && hasId)
                datastore.DatastoreName = datastore.DatastoreId.Trim();
        }

        proposal.AddedDatastores = proposal.AddedDatastores
            .Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName))
            .ToList();

        // Drop relationships missing source/target — they cannot be resolved in the merge graph.
        proposal.AddedRelationships = proposal.AddedRelationships
            .Where(r => !string.IsNullOrWhiteSpace(r.SourceId) && !string.IsNullOrWhiteSpace(r.TargetId))
            .ToList();

        foreach (ManifestRelationship relationship in proposal.AddedRelationships)
        {
            if (string.IsNullOrWhiteSpace(relationship.RelationshipId))
                relationship.RelationshipId = Guid.NewGuid().ToString("N");

            // JsonStringEnumConverter (registered before RelationshipTypeJsonConverter) serializes
            // undefined enum values as their raw integer, which fails the schema's string enum
            // constraint. Coerce any undefined value to Calls so the wire document stays valid.
            if (!Enum.IsDefined(relationship.RelationshipType))
                relationship.RelationshipType = RelationshipType.Calls;
        }
    }
}
