using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerTopologyProposalMapperTests
{
    [Fact]
    public void MapCandidates_empty_proposal_returns_no_rows()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Description = "desc",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTopologyProposal proposal = new() { ProposalId = "p1" };
        DateTime utc = DateTime.UtcNow;

        IReadOnlyList<TechnologyLedgerEntry> candidates =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, utc);

        candidates.Should().BeEmpty();
    }

    [Fact]
    public void MapCandidates_maps_services_datastores_region_and_cloud_platform()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Description = "desc",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTopologyProposal proposal = new()
        {
            ProposalId = "p1",
            AddedServices =
            [
                new ManifestService
                {
                    ServiceId = "svc-api",
                    ServiceName = "rag-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                    AzureArmRegion = "eastus",
                },
            ],
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "ds-metadata",
                    DatastoreName = "rag-metadata",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
        };

        DateTime utc = DateTime.UtcNow;
        IReadOnlyList<TechnologyLedgerEntry> candidates =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, utc);

        candidates.Should().Contain(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime && entry.TechnologyName == "rag-api");
        candidates.Should().Contain(entry => entry.Role == TechnologyLedgerRole.PrimaryDatastore && entry.TechnologyName == "rag-metadata");
        candidates.Should().Contain(entry => entry.Role == TechnologyLedgerRole.Region && entry.TechnologyName == "eastus");
        candidates.Should().Contain(entry => entry.Role == TechnologyLedgerRole.CloudPlatform);
        candidates.Should().OnlyContain(entry => entry.Source == TechnologyLedgerSource.AgentProposed);
        candidates.Should().OnlyContain(entry => entry.Status == TechnologyLedgerStatus.Assumed);
    }
}
