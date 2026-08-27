using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class AgentTopologyProposalMergeGate
{
    private static void RegisterSanitizedProposalEndpointKeys(
        AgentTopologyProposal proposal,
        HashSet<string> endpointKeys)
    {
        if (proposal.AddedServices is { Count: > 0 })
        {
            foreach (ManifestService service in proposal.AddedServices)
            {
                TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(endpointKeys, service);
            }
        }

        if (proposal.AddedDatastores is { Count: > 0 })
        {
            foreach (ManifestDatastore datastore in proposal.AddedDatastores)
            {
                TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(endpointKeys, datastore);
            }
        }
    }

    private static void PreRegisterDeclaredProposalEndpointKeys(
        AgentTopologyProposal proposal,
        HashSet<string> endpointKeys,
        bool greenfield,
        bool allowTopologyExtension = false)
    {
        if (proposal.AddedServices is { Count: > 0 })
        {
            foreach (ManifestService service in proposal.AddedServices)
            {
                if (!ShouldPreRegisterDeclaredEndpoint(
                        greenfield,
                        allowTopologyExtension,
                        proposal.SourceAgent,
                        service.ServiceName,
                        service.ServiceId,
                        endpointKeys))
                {
                    continue;
                }

                TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(endpointKeys, service);
            }
        }

        if (proposal.AddedDatastores is { Count: > 0 })
        {
            foreach (ManifestDatastore datastore in proposal.AddedDatastores)
            {
                if (!ShouldPreRegisterDeclaredEndpoint(
                        greenfield,
                        allowTopologyExtension,
                        proposal.SourceAgent,
                        datastore.DatastoreName,
                        datastore.DatastoreId,
                        endpointKeys))
                {
                    continue;
                }

                TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(endpointKeys, datastore);
            }
        }
    }

    private static bool ShouldPreRegisterDeclaredEndpoint(
        bool greenfield,
        bool allowTopologyExtension,
        AgentType sourceAgent,
        string? primaryName,
        string? alternateId,
        HashSet<string> endpointKeys)
    {
        if (greenfield)
            return true;

        if (MatchesInventoriedIdentifier(primaryName, alternateId, endpointKeys))
            return true;

        return allowTopologyExtension && sourceAgent == AgentType.Topology;
    }

    private static bool RequiresInventoryOverlayValidation(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Cost or AgentType.Compliance or AgentType.Critic;

    private static AgentTopologyProposal SanitizeProposal(
        AgentTopologyProposal proposal,
        HashSet<string> relationshipEndpointKeys,
        bool allowTopologyExtension = false)
    {
        List<ManifestService> services = proposal.AddedServices?
            .Where(s => !string.IsNullOrWhiteSpace(s.ServiceName) || !string.IsNullOrWhiteSpace(s.ServiceId))
            .Where(s => MatchesInventoriedIdentifier(s.ServiceName, s.ServiceId, relationshipEndpointKeys)
                || (allowTopologyExtension && proposal.SourceAgent == AgentType.Topology))
            .ToList() ?? [];

        List<ManifestDatastore> datastores = proposal.AddedDatastores?
            .Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName) || !string.IsNullOrWhiteSpace(d.DatastoreId))
            .Where(d => MatchesInventoriedIdentifier(d.DatastoreName, d.DatastoreId, relationshipEndpointKeys)
                || (allowTopologyExtension && proposal.SourceAgent == AgentType.Topology))
            .ToList() ?? [];

        List<ManifestRelationship> relationships = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            relationshipEndpointKeys,
            services,
            datastores,
            proposal.AddedRelationships);

        return new AgentTopologyProposal
        {
            ProposalId = proposal.ProposalId,
            SourceAgent = proposal.SourceAgent,
            AddedServices = services,
            AddedDatastores = datastores,
            AddedRelationships = relationships,
            RequiredControls = proposal.RequiredControls,
            Warnings = proposal.Warnings
        };
    }

    private static bool MatchesInventoriedIdentifier(
        string? primaryName,
        string? alternateId,
        HashSet<string> inventoriedIdentifiers)
    {
        if (TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(primaryName, inventoriedIdentifiers))
            return true;

        if (TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(alternateId, inventoriedIdentifiers))
            return true;

        return false;
    }

    private static bool ProposalIsEmpty(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) == 0
        && (proposal.AddedDatastores?.Count ?? 0) == 0
        && (proposal.AddedRelationships?.Count ?? 0) == 0
        && (proposal.RequiredControls?.Count ?? 0) == 0;

    private static AgentResult CloneWithProposal(AgentResult source, AgentTopologyProposal proposal)
    {
        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Claims = source.Claims,
            EvidenceRefs = source.EvidenceRefs,
            Confidence = source.Confidence,
            Findings = source.Findings,
            ProposedChanges = proposal,
            ReasoningTrace = source.ReasoningTrace,
            CreatedUtc = source.CreatedUtc
        };
    }
}
