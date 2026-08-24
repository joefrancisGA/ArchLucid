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

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerAgentProposalMergePolicyTests
{
    [Fact]
    public void Resolve_inserts_assumed_when_role_has_no_entries()
    {
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved = TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, []);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_duplicate_same_family_when_chosen_exists()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_inserts_assumed_on_provider_conflict()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_chosen_is_locked()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.IsLocked = true;
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_duplicate_assumed_when_no_chosen_exists()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_duplicate_assumed_when_chosen_provider_differs()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen, existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_treats_technology_name_case_insensitively()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.TechnologyName = "PostgreSQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.TechnologyName = "postgresql";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_when_evidence_ref_already_present()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existingAssumed.TechnologyName = "api-a";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "api-b";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_when_evidence_ref_matches_across_provider_families()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure Container Apps";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    private static TechnologyLedgerEntry CreateChosen(CloudProvider provider) =>
        new()
        {
            RunId = "run-1",
            Role = TechnologyLedgerRole.ComputeRuntime,
            TechnologyName = "chosen",
            ProviderFamily = provider,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static TechnologyLedgerEntry CreateCandidate(CloudProvider provider) =>
        new()
        {
            RunId = "run-1",
            Role = TechnologyLedgerRole.ComputeRuntime,
            TechnologyName = "candidate",
            ProviderFamily = provider,
            Status = TechnologyLedgerStatus.Assumed,
            Source = TechnologyLedgerSource.AgentProposed,
            EvidenceRef = "agentTopologyProposal:p1:candidate",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
