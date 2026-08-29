using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FsCheck;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     FsCheck generator for small agent topology proposal batches used by merge property tests.
/// </summary>
public static class AgentTopologyProposalArbitrary
{
    public const int MaxResultCount = 3;
    public const int MaxAddedPerKind = 2;

    private static readonly AgentType[] ProposalAgentTypes =
    [
        AgentType.Topology,
        AgentType.Cost,
        AgentType.Compliance,
        AgentType.Critic
    ];

    public static Arbitrary<AgentResult[]> ProposalBatches()
    {
        return BatchGen().ToArbitrary();
    }

    internal static Gen<AgentResult[]> BatchGen()
    {
        return from count in Gen.Choose(0, MaxResultCount)
               from results in Gen.ArrayOf(ResultGen(), count)
               select StampResultIds(results);
    }

    private static Gen<AgentResult> ResultGen()
    {
        return from agentType in Gen.Elements(ProposalAgentTypes)
               from serviceCount in Gen.Choose(0, MaxAddedPerKind)
               from datastoreCount in Gen.Choose(0, MaxAddedPerKind)
               from relationshipCount in Gen.Choose(0, MaxAddedPerKind)
               from includeUnknownRelationship in Arb.Default.Bool().Generator
               select BuildResult(agentType, serviceCount, datastoreCount, relationshipCount, includeUnknownRelationship);
    }

    private static AgentResult[] StampResultIds(AgentResult[] results)
    {
        for (int i = 0; i < results.Length; i++)
        {
            results[i].ResultId = "r" + i;
            results[i].TaskId = "t" + i;
            results[i].RunId = "run-property";
        }

        return results;
    }

    private static AgentResult BuildResult(
        AgentType agentType,
        int serviceCount,
        int datastoreCount,
        int relationshipCount,
        bool includeUnknownRelationship)
    {
        bool materializesNodes = agentType == AgentType.Topology;
        int services = materializesNodes ? serviceCount : 0;
        int datastores = materializesNodes ? datastoreCount : 0;

        AgentTopologyProposal proposal = new()
        {
            ProposalId = "p-" + agentType,
            SourceAgent = agentType,
            AddedServices = BuildServices(agentType, services),
            AddedDatastores = BuildDatastores(agentType, datastores),
            AddedRelationships = BuildRelationships(
                agentType,
                relationshipCount,
                includeUnknownRelationship,
                materializesNodes)
        };

        return new AgentResult
        {
            AgentType = agentType,
            ProposedChanges = proposal,
            Confidence = 0.5d
        };
    }

    private static List<ManifestService> BuildServices(AgentType agentType, int count)
    {
        List<ManifestService> services = [];
        string prefix = AgentPrefix(agentType);

        for (int i = 0; i < count; i++)
        {
            services.Add(new ManifestService
            {
                ServiceId = prefix + "-svc-" + i,
                ServiceName = prefix + "-svcname-" + i,
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService
            });
        }

        return services;
    }

    private static List<ManifestDatastore> BuildDatastores(AgentType agentType, int count)
    {
        List<ManifestDatastore> datastores = [];
        string prefix = AgentPrefix(agentType);

        for (int i = 0; i < count; i++)
        {
            datastores.Add(new ManifestDatastore
            {
                DatastoreId = prefix + "-ds-" + i,
                DatastoreName = prefix + "-dsname-" + i,
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer
            });
        }

        return datastores;
    }

    private static List<ManifestRelationship> BuildRelationships(
        AgentType agentType,
        int count,
        bool includeUnknownRelationship,
        bool materializesNodes)
    {
        List<ManifestRelationship> relationships = [];
        string prefix = AgentPrefix(agentType);

        for (int i = 0; i < count; i++)
        {
            bool unknown = includeUnknownRelationship && i == 0;
            string sourceId = unknown
                ? "missing-source"
                : materializesNodes
                    ? prefix + "-svc-" + 0
                    : GraphSnapshotArbitrary.NodeLabel(0);
            string targetId = unknown
                ? "missing-target"
                : materializesNodes
                    ? prefix + "-ds-" + 0
                    : GraphSnapshotArbitrary.NodeLabel(1);

            relationships.Add(new ManifestRelationship
            {
                RelationshipId = prefix + "-rel-" + i,
                SourceId = sourceId,
                TargetId = targetId,
                RelationshipType = RelationshipType.ReadsFrom
            });
        }

        return relationships;
    }

    private static string AgentPrefix(AgentType agentType) => agentType.ToString().ToLowerInvariant();
}
