using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

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
        candidate.EvidenceRef = null;

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
    public void Resolve_inserts_cross_provider_candidate_when_chosen_is_locked()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.IsLocked = true;
        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_inserts_same_family_candidate_with_distinct_name_when_chosen_is_locked()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:sql";
        chosen.IsLocked = true;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure App Service";
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_same_family_same_name_candidate_when_chosen_is_locked()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:sql";
        chosen.IsLocked = true;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p1:db";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_keeps_distinct_topology_ref_when_locked_authoritative_chosen_lacks_grounding_ref()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "shared-display";
        chosen.EvidenceRef = null;
        chosen.IsLocked = true;
        chosen.Source = TechnologyLedgerSource.User;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "shared-display";
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-b";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
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

    [Fact]
    public void Resolve_keeps_distinct_evidence_ref_when_family_and_technology_name_match()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_distinct_evidence_ref_when_chosen_provider_family_matches()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.EvidenceRef = "inventory:chosen";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_evidence_ref_matches_case_insensitively()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "agentTopologyProposal:P1:svc-api";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure Container Apps";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_when_technology_name_differs_only_by_internal_whitespace()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = null;
        candidate.TechnologyName = "Amazon  ECS";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_keeps_distinct_evidence_ref_when_existing_row_has_whitespace_only_ref()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "   ";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_agent_evidence_when_chosen_shares_name_but_lacks_grounding_ref()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Amazon ECS";
        chosen.EvidenceRef = null;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Amazon ECS";
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_chosen_shares_technology_name_and_has_grounding_ref()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Amazon ECS";
        chosen.EvidenceRef = "inventory:arm:ecs-cluster";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Amazon ECS";
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_skips_when_cloud_neutral_authoritative_chosen_shares_technology_name()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.None);
        chosen.TechnologyName = "PostgreSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "PostgreSQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_authoritative_chosen_shares_technology_name_with_cloud_neutral_candidate()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "PostgreSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.None);
        candidate.TechnologyName = "PostgreSQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_cloud_neutral_candidate_when_authoritative_chosen_has_different_technology_name()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "PostgreSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.None);
        candidate.TechnologyName = "Cloud-neutral runtime";
        candidate.EvidenceRef = "agentTopologyProposal:p2:runtime";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_agent_candidate_when_cloud_neutral_chosen_has_different_technology_name()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.None);
        chosen.TechnologyName = "PostgreSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure App Service";
        candidate.EvidenceRef = "agentTopologyProposal:p2:api";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_cloud_neutral_authoritative_chosen_shares_technology_name_with_cloud_neutral_candidate()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.None);
        chosen.TechnologyName = "PostgreSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.None);
        candidate.TechnologyName = "PostgreSQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_inserts_assumed_on_provider_conflict_when_technology_name_differs()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.TechnologyName = "Amazon RDS";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_second_compute_candidate_after_cold_start_chosen_shares_display_name()
    {
        TechnologyLedgerEntry first = CreateCandidate(CloudProvider.Azure);
        first.TechnologyName = "shared-display";
        first.EvidenceRef = "agentTopologyProposal:p1:svc-a";
        first = TechnologyLedgerColdStartChosenPromoter.Apply(first, []);

        first.Status.Should().Be(TechnologyLedgerStatus.Chosen);

        TechnologyLedgerEntry second = CreateCandidate(CloudProvider.Azure);
        second.TechnologyName = "shared-display";
        second.EvidenceRef = "agentTopologyProposal:p1:svc-b";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(second, [first]);

        resolved.Should().BeSameAs(second);
    }

    [Fact]
    public void Resolve_keeps_second_compute_candidate_when_locked_cold_start_chosen_shares_display_name()
    {
        TechnologyLedgerEntry first = CreateCandidate(CloudProvider.Azure);
        first.TechnologyName = "shared-display";
        first.EvidenceRef = "agentTopologyProposal:p1:svc-a";
        first = TechnologyLedgerColdStartChosenPromoter.Apply(first, []);
        first.IsLocked = true;

        TechnologyLedgerEntry second = CreateCandidate(CloudProvider.Azure);
        second.TechnologyName = "shared-display";
        second.EvidenceRef = "agentTopologyProposal:p1:svc-b";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(second, [first]);

        resolved.Should().BeSameAs(second);
    }

    [Fact]
    public void Resolve_keeps_compute_candidate_when_only_other_role_shares_evidence_ref()
    {
        TechnologyLedgerEntry databaseAssumed = CreateCandidate(CloudProvider.Aws);
        databaseAssumed.Role = TechnologyLedgerRole.PrimaryDatastore;
        databaseAssumed.EvidenceRef = "agentTopologyProposal:p1:shared";
        databaseAssumed.TechnologyName = "Cosmos DB";

        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Aws);
        chosen.EvidenceRef = "inventory:ecs";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:shared";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [databaseAssumed, chosen]);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_evidence_ref_differs_only_by_outer_whitespace()
    {
        TechnologyLedgerEntry existingAssumed = CreateCandidate(CloudProvider.Aws);
        existingAssumed.EvidenceRef = "  agentTopologyProposal:p1:svc-api  ";
        existingAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure Container Apps";

        TechnologyLedgerEntry? resolved =
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existingAssumed]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void MapCandidates_same_service_name_distinct_service_ids_both_survive_merge_policy()
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
                    ServiceId = "svc-a",
                    ServiceName = "shared-display",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "svc-b",
                    ServiceName = "shared-display",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        IReadOnlyList<TechnologyLedgerEntry> mapped =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, DateTime.UtcNow);

        IReadOnlyList<TechnologyLedgerEntry> computeCandidates = mapped
            .Where(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime)
            .ToList();

        computeCandidates.Should().HaveCount(2);
        computeCandidates.Select(entry => entry.EvidenceRef).Should().OnlyHaveUniqueItems();

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in computeCandidates)
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            existing.Add(resolved!);
        }

        existing.Should().HaveCount(2);
        existing.Select(entry => entry.TechnologyName).Should().AllBe("shared-display");
    }

    [Fact]
    public void MapCandidates_distinct_service_ids_that_slug_collide_both_survive_merge_policy()
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
                    ServiceId = "foo bar",
                    ServiceName = "api-a",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "foo-bar",
                    ServiceName = "api-b",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        IReadOnlyList<TechnologyLedgerEntry> mapped =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, DateTime.UtcNow);

        IReadOnlyList<TechnologyLedgerEntry> computeCandidates = mapped
            .Where(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime)
            .ToList();

        computeCandidates.Should().HaveCount(2);
        computeCandidates.Select(entry => entry.EvidenceRef).Should().OnlyHaveUniqueItems();

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in computeCandidates)
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            existing.Add(resolved!);
        }

        existing.Should().HaveCount(2);
    }

    [Fact]
    public void MapCandidates_whitespace_service_ids_with_slug_colliding_names_both_survive_merge_policy()
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
                    ServiceId = "   ",
                    ServiceName = "foo bar",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "  ",
                    ServiceName = "foo-bar",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        IReadOnlyList<TechnologyLedgerEntry> mapped =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, DateTime.UtcNow);

        IReadOnlyList<TechnologyLedgerEntry> computeCandidates = mapped
            .Where(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime)
            .ToList();

        computeCandidates.Should().HaveCount(2);
        computeCandidates.Select(entry => entry.EvidenceRef).Should().OnlyHaveUniqueItems();

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in computeCandidates)
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            existing.Add(resolved!);
        }

        existing.Should().HaveCount(2);
    }

    [Fact]
    public void MapCandidates_distinct_service_ids_differing_only_by_case_both_survive_merge_policy()
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
                    ServiceId = "Svc-A",
                    ServiceName = "api-a",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "svc-a",
                    ServiceName = "api-b",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        IReadOnlyList<TechnologyLedgerEntry> computeCandidates = MapComputeCandidates(request, proposal).ToList();

        computeCandidates.Should().HaveCount(2);
        computeCandidates.Select(entry => entry.EvidenceRef).Should().OnlyHaveUniqueItems();

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in computeCandidates)
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            existing.Add(resolved!);
        }

        existing.Should().HaveCount(2);
    }

    [Fact]
    public void MapCandidates_missing_service_ids_reseed_with_reordered_services_dedupes_via_merge_policy()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Description = "desc",
            CloudProvider = CloudProvider.Azure,
        };

        ManifestService serviceA = new()
        {
            ServiceId = "   ",
            ServiceName = "foo bar",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.AppService,
        };

        ManifestService serviceB = new()
        {
            ServiceId = "  ",
            ServiceName = "foo-bar",
            ServiceType = ServiceType.Worker,
            RuntimePlatform = RuntimePlatform.AppService,
        };

        AgentTopologyProposal firstPass = new()
        {
            ProposalId = "p1",
            AddedServices = [serviceA, serviceB],
        };

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in MapComputeCandidates(request, firstPass))
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            existing.Add(resolved!);
        }

        existing.Should().HaveCount(2);

        AgentTopologyProposal secondPass = new()
        {
            ProposalId = "p1",
            AddedServices = [serviceB, serviceA],
        };

        foreach (TechnologyLedgerEntry candidate in MapComputeCandidates(request, secondPass))
        {
            TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing).Should().BeNull();
        }

        existing.Should().HaveCount(2);
    }

    private static IEnumerable<TechnologyLedgerEntry> MapComputeCandidates(
        ArchitectureRequest request,
        AgentTopologyProposal proposal)
    {
        return TechnologyLedgerTopologyProposalMapper
            .MapCandidates("run-1", request, proposal, DateTime.UtcNow)
            .Where(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime);
    }

    [Fact]
    public void Seeder_sequence_keeps_distinct_topology_services_after_cold_start_promotion()
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
                    ServiceId = "svc-a",
                    ServiceName = "shared-display",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "svc-b",
                    ServiceName = "shared-display",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        IReadOnlyList<TechnologyLedgerEntry> mapped =
            TechnologyLedgerTopologyProposalMapper.MapCandidates("run-1", request, proposal, DateTime.UtcNow);

        List<TechnologyLedgerEntry> existing = [];

        foreach (TechnologyLedgerEntry candidate in mapped.Where(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime))
        {
            TechnologyLedgerEntry? resolved =
                TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existing);

            resolved.Should().NotBeNull();
            TechnologyLedgerEntry promoted =
                TechnologyLedgerColdStartChosenPromoter.Apply(resolved!, existing);

            existing.Add(promoted);
        }

        existing.Should().HaveCount(2);
        existing.Should().ContainSingle(entry => entry.Status == TechnologyLedgerStatus.Chosen);
        existing.Should().ContainSingle(entry => entry.Status == TechnologyLedgerStatus.Assumed);
    }

    [Fact]
    public void Resolve_returns_null_for_whitespace_only_evidence_ref_when_chosen_has_distinct_technology_name()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure App Service";
        candidate.EvidenceRef = "   ";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_distinct_malformed_agent_topology_refs_missing_subkey()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:proposal-a";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:proposal-b";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_dedupes_agent_topology_refs_using_first_colon_separator_in_remainder()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:urn:segment:svc-a";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:urn:segment:svc-b";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_future_row_shares_evidence_ref()
    {
        TechnologyLedgerEntry future = CreateCandidate(CloudProvider.Aws);
        future.Status = TechnologyLedgerStatus.Future;
        future.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        future.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure Container Apps";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [future])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_distinct_technology_names_when_labels_differ_only_by_full_width_digits()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Service２";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";
        candidate.TechnologyName = "Service2";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_distinct_technology_names_when_labels_differ_only_by_full_width_latin_letters()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "\uFF21zure SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";
        candidate.TechnologyName = "Azure SQL";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_candidate_when_agent_topology_ref_has_spaces_around_proposal_segments()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal: p1 :svc-api";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_inserts_candidate_when_same_topology_evidence_ref_applies_to_different_role()
    {
        TechnologyLedgerEntry computeRow = CreateCandidate(CloudProvider.Azure);
        computeRow.Role = TechnologyLedgerRole.ComputeRuntime;
        computeRow.EvidenceRef = "agentTopologyProposal:p1:shared-ref";
        computeRow.TechnologyName = "Azure App Service";

        TechnologyLedgerEntry regionCandidate = CreateCandidate(CloudProvider.Azure);
        regionCandidate.Role = TechnologyLedgerRole.Region;
        regionCandidate.EvidenceRef = "agentTopologyProposal:p1:shared-ref";
        regionCandidate.TechnologyName = "East US";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(regionCandidate, [computeRow])
            .Should()
            .BeSameAs(regionCandidate);
    }

    [Fact]
    public void Resolve_inserts_region_candidate_when_compute_chosen_would_block_same_family_compute()
    {
        TechnologyLedgerEntry computeChosen = CreateChosen(CloudProvider.Azure);
        computeChosen.TechnologyName = "Azure App Service";
        computeChosen.EvidenceRef = "inventory:compute";

        TechnologyLedgerEntry regionCandidate = CreateCandidate(CloudProvider.Azure);
        regionCandidate.Role = TechnologyLedgerRole.Region;
        regionCandidate.TechnologyName = "East US";
        regionCandidate.EvidenceRef = "agentTopologyProposal:p1:east-us";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(regionCandidate, [computeChosen])
            .Should()
            .BeSameAs(regionCandidate);
    }

    [Fact]
    public void Resolve_keeps_substantive_candidate_when_alternative_row_shares_name_without_grounding_ref()
    {
        TechnologyLedgerEntry alternative = CreateCandidate(CloudProvider.Azure);
        alternative.Status = TechnologyLedgerStatus.Alternative;
        alternative.TechnologyName = "Azure SQL";
        alternative.EvidenceRef = null;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [alternative])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_malformed_topology_refs_match_via_case_insensitive_string_fallback()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:proposal-a";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "AGENTTOPOLOGYPROPOSAL:PROPOSAL-A";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_empty_subkey_topology_refs_match_via_case_insensitive_string_fallback()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:P1:";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_candidate_when_empty_subkey_topology_ref_differs_from_substantive_ref()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_uses_first_chosen_row_when_multiple_chosen_entries_share_role()
    {
        TechnologyLedgerEntry agentChosenFirst = CreateChosen(CloudProvider.Azure);
        agentChosenFirst.Source = TechnologyLedgerSource.AgentProposed;
        agentChosenFirst.TechnologyName = "Azure SQL";
        agentChosenFirst.EvidenceRef = null;

        TechnologyLedgerEntry userChosenSecond = CreateChosen(CloudProvider.Azure);
        userChosenSecond.TechnologyName = "Azure SQL";
        userChosenSecond.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [agentChosenFirst, userChosenSecond])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_distinct_technology_names_for_turkish_dotless_i_vs_latin_capital_i()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-a";
        existing.TechnologyName = "Azur\u0131";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-b";
        candidate.TechnologyName = "Azur\u0049";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_both_assumed_rows_have_whitespace_only_refs_and_matching_technology_name()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "   ";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "\t";
        candidate.TechnologyName = "Amazon  ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_cloud_platform_candidate_when_same_proposal_id_and_cloud_platform_subkey()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.Role = TechnologyLedgerRole.CloudPlatform;
        existing.TechnologyName = "Microsoft Azure";
        existing.EvidenceRef = "agentTopologyProposal:p1:cloud-platform";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.Role = TechnologyLedgerRole.CloudPlatform;
        candidate.TechnologyName = "Microsoft Azure";
        candidate.EvidenceRef = "agentTopologyProposal:p1:cloud-platform";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_inserts_primary_datastore_candidate_when_compute_chosen_would_block_compute_only()
    {
        TechnologyLedgerEntry computeChosen = CreateChosen(CloudProvider.Azure);
        computeChosen.TechnologyName = "Azure App Service";
        computeChosen.EvidenceRef = "inventory:compute";

        TechnologyLedgerEntry datastoreCandidate = CreateCandidate(CloudProvider.Azure);
        datastoreCandidate.Role = TechnologyLedgerRole.PrimaryDatastore;
        datastoreCandidate.TechnologyName = "Azure SQL";
        datastoreCandidate.EvidenceRef = "agentTopologyProposal:p1:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(datastoreCandidate, [computeChosen])
            .Should()
            .BeSameAs(datastoreCandidate);
    }

    [Fact]
    public void Resolve_skips_when_outer_evidence_ref_differs_only_by_trailing_whitespace()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Aws);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Aws);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api ";
        candidate.TechnologyName = "Amazon ECS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_region_candidate_when_region_chosen_shares_technology_name_and_has_grounding_ref()
    {
        TechnologyLedgerEntry regionChosen = CreateChosen(CloudProvider.Azure);
        regionChosen.Role = TechnologyLedgerRole.Region;
        regionChosen.TechnologyName = "East US";
        regionChosen.EvidenceRef = "inventory:region:eastus";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.Role = TechnologyLedgerRole.Region;
        candidate.TechnologyName = "East US";
        candidate.EvidenceRef = "agentTopologyProposal:p2:east-us";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [regionChosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_topology_candidate_when_inventory_assumed_row_shares_technology_name()
    {
        TechnologyLedgerEntry inventoryAssumed = CreateCandidate(CloudProvider.Azure);
        inventoryAssumed.EvidenceRef = "inventory:arm:sql";
        inventoryAssumed.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [inventoryAssumed])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_same_family_candidate_when_locked_evidence_chosen_shares_technology_name()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.Source = TechnologyLedgerSource.Evidence;
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:arm:sql";
        chosen.IsLocked = true;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_technology_names_differ_only_by_tab_vs_space_separators()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure\tSQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_technology_names_differ_only_by_nbsp_vs_space_separators()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure\u00A0SQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Theory]
    [InlineData('\u3000')]
    [InlineData('\u2007')]
    public void Resolve_skips_when_technology_names_differ_only_by_unicode_space_separators(char separator)
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = $"Azure{separator}SQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_candidate_when_alternative_row_has_substantive_ref_with_distinct_topology_ref()
    {
        TechnologyLedgerEntry alternative = CreateCandidate(CloudProvider.Azure);
        alternative.Status = TechnologyLedgerStatus.Alternative;
        alternative.TechnologyName = "Azure SQL";
        alternative.EvidenceRef = "inventory:sql-alt";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [alternative])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_distinct_candidates_when_technology_names_differ_only_by_middle_dot_separator()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Azure\u00B7SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:svc-api";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_ungrounded_candidate_when_substantive_assumed_row_shares_technology_name()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = null;

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_distinct_agent_topology_subkeys_when_subkey_differs_only_by_case()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:Svc-A";
        existing.TechnologyName = "api-a";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-a";
        candidate.TechnologyName = "api-b";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_candidate_when_future_row_shares_technology_name_but_distinct_substantive_refs()
    {
        TechnologyLedgerEntry future = CreateCandidate(CloudProvider.Azure);
        future.Status = TechnologyLedgerStatus.Future;
        future.TechnologyName = "Azure SQL";
        future.EvidenceRef = "agentTopologyProposal:p1:db-old";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db-new";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [future])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_inserts_candidate_when_chosen_technology_name_normalizes_to_empty()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "   ";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_inserts_second_cloud_platform_row_when_proposal_id_changes()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.Role = TechnologyLedgerRole.CloudPlatform;
        existing.TechnologyName = "Microsoft Azure";
        existing.EvidenceRef = "agentTopologyProposal:p1:cloud-platform";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.Role = TechnologyLedgerRole.CloudPlatform;
        candidate.TechnologyName = "Microsoft Azure";
        candidate.EvidenceRef = "agentTopologyProposal:p2:cloud-platform";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_keeps_distinct_technology_names_when_labels_differ_only_by_embedded_zwsp()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.Azure);
        chosen.TechnologyName = "Azure SQL";
        chosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure\u200BSQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_assumed_row_shares_topology_ref_before_chosen_exploration_gate()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.None);
        chosen.TechnologyName = "Undecided platform";
        chosen.EvidenceRef = "user:neutral";

        TechnologyLedgerEntry assumed = CreateCandidate(CloudProvider.Azure);
        assumed.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        assumed.TechnologyName = "Azure Kubernetes Service";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure AKS";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen, assumed])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_substantive_rows_share_topology_ref_before_name_dedupe_path()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "Service A";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Service B";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_candidate_when_proposal_id_differs_only_by_case_but_subkeys_differ()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:P1:svc-a";
        existing.TechnologyName = "api-a";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-b";
        candidate.TechnologyName = "api-b";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_alternative_row_shares_topology_evidence_ref()
    {
        TechnologyLedgerEntry alternative = CreateCandidate(CloudProvider.Azure);
        alternative.Status = TechnologyLedgerStatus.Alternative;
        alternative.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        alternative.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        candidate.TechnologyName = "Azure SQL replica";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [alternative])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_inventory_evidence_refs_match_case_insensitively()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "inventory:arm:sql";
        existing.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "INVENTORY:arm:sql";
        candidate.TechnologyName = "Azure SQL managed instance";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_skips_when_cloud_neutral_chosen_shares_technology_name_after_whitespace_normalization()
    {
        TechnologyLedgerEntry chosen = CreateChosen(CloudProvider.None);
        chosen.TechnologyName = "Postgre\tSQL";
        chosen.EvidenceRef = "inventory:postgresql";
        chosen.Source = TechnologyLedgerSource.Evidence;

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Postgre SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [chosen])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_uses_first_chosen_only_when_later_chosen_would_block_same_name_candidate()
    {
        TechnologyLedgerEntry firstChosen = CreateChosen(CloudProvider.Azure);
        firstChosen.TechnologyName = "Azure App Service";
        firstChosen.EvidenceRef = null;

        TechnologyLedgerEntry secondChosen = CreateChosen(CloudProvider.Azure);
        secondChosen.TechnologyName = "Azure SQL";
        secondChosen.EvidenceRef = "inventory:sql";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.TechnologyName = "Azure SQL";
        candidate.EvidenceRef = "agentTopologyProposal:p2:db";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [firstChosen, secondChosen])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_cross_provider_assumed_row_shares_topology_evidence_ref()
    {
        TechnologyLedgerEntry awsAssumed = CreateCandidate(CloudProvider.Aws);
        awsAssumed.EvidenceRef = "agentTopologyProposal:p1:shared-runtime";
        awsAssumed.TechnologyName = "Amazon ECS";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "agentTopologyProposal:p1:shared-runtime";
        candidate.TechnologyName = "Azure Container Apps";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [awsAssumed])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Resolve_keeps_dual_ungrounded_candidates_when_technology_names_differ_after_normalization()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = null;
        existing.TechnologyName = "Azure  SQL";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = null;
        candidate.TechnologyName = "Azure App Service";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_topology_ref_prefix_differs_only_by_case()
    {
        TechnologyLedgerEntry existing = CreateCandidate(CloudProvider.Azure);
        existing.EvidenceRef = "agentTopologyProposal:p1:svc-api";
        existing.TechnologyName = "api-a";

        TechnologyLedgerEntry candidate = CreateCandidate(CloudProvider.Azure);
        candidate.EvidenceRef = "AGENTTOPOLOGYPROPOSAL:p1:svc-api";
        candidate.TechnologyName = "api-b";

        TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, [existing])
            .Should()
            .BeNull();
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
