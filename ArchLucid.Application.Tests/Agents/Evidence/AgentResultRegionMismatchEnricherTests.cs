using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultRegionMismatchEnricherTests
{
    private readonly AgentResultRegionMismatchEnricher _sut = new();

    [Fact]
    public async Task EnrichAsync_appends_warning_when_openai_named_service_omits_runtime_platform_in_restricted_region()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "Azure OpenAI completion",
                    RuntimePlatform = RuntimePlatform.Unknown,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("RegionMismatch");
        proposal.Warnings[0].Should().Contain("Microsoft.CognitiveServices/accounts");
    }

    [Fact]
    public async Task EnrichAsync_appends_warning_when_machine_learning_named_service_omits_runtime_platform_in_restricted_region()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "Azure Machine Learning scoring",
                    RuntimePlatform = RuntimePlatform.Unknown,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("RegionMismatch");
        proposal.Warnings[0].Should().Contain("Microsoft.MachineLearningServices/workspaces");
    }

    [Fact]
    public async Task EnrichAsync_appends_warning_when_azure_openai_region_is_restricted()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("RegionMismatch");
        proposal.Warnings[0].Should().Contain("qatarcentral");
    }

    [Fact]
    public async Task EnrichAsync_does_not_duplicate_existing_warnings()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        string existingWarning =
            "RegionMismatch: 'Microsoft.CognitiveServices/accounts' may not be available in region 'qatarcentral'.";

        AgentTopologyProposal proposal = new()
        {
            Warnings = [existingWarning],
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Be(existingWarning);
    }

    [Fact]
    public async Task EnrichAsync_validates_each_request_region_constraint_when_service_region_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:westeurope", "region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("qatarcentral");
    }

    [Fact]
    public async Task EnrichAsync_uses_request_region_constraint_when_service_region_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_uses_request_region_constraint_when_constraint_has_leading_whitespace_and_service_region_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = [" region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("RegionMismatch");
        proposal.Warnings[0].Should().Contain("qatarcentral");
    }

    [Fact]
    public async Task EnrichAsync_initializes_warnings_when_null_before_appending_region_mismatch()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        proposal.Warnings = null!;

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("RegionMismatch");
    }

    [Fact]
    public async Task EnrichAsync_tolerates_null_added_services_after_structural_lists_normalized()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:westeurope"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices = null!,
            AddedDatastores = null!,
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
        proposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public async Task EnrichAsync_tolerates_null_constraints_list()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = null!,
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
        proposal.Warnings.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_null_constraint_entries_when_service_region_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral", null!],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        proposal.Warnings.Should().ContainSingle();
        proposal.Warnings[0].Should().Contain("qatarcentral");
    }

    [Fact]
    public async Task EnrichAsync_skips_null_result_entries()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            null!,
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
        proposal.Warnings.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_null_added_service_entries()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedServices =
            [
                null!,
                new ManifestService
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
        proposal.Warnings.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_null_added_datastore_entries()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        AgentTopologyProposal proposal = new()
        {
            AddedDatastores =
            [
                null!,
                new ManifestDatastore
                {
                    RuntimePlatform = RuntimePlatform.AzureOpenAi,
                    AzureArmRegion = "qatarcentral",
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", request, new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
        proposal.Warnings.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_results_without_proposed_changes()
    {
        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run",
                TaskId = "task",
                AgentType = AgentType.Topology,
                ProposedChanges = null,
            },
        ];

        Func<Task> act = async () =>
            await _sut.EnrichAsync("run", new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
                new AgentEvidencePackage(), results, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
