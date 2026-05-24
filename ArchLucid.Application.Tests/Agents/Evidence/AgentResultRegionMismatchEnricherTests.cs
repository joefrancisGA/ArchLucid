using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Decisions;
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
    public async Task EnrichAsync_appends_warning_when_azure_openai_region_is_restricted()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        ManifestDeltaProposal proposal = new()
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
        proposal.Warnings[0].Should().Contain("RegionMismatch", StringComparison.Ordinal);
        proposal.Warnings[0].Should().Contain("qatarcentral", StringComparison.OrdinalIgnoreCase);
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

        ManifestDeltaProposal proposal = new()
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
    public async Task EnrichAsync_uses_request_region_constraint_when_service_region_missing()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
            Constraints = ["region:qatarcentral"],
        };

        ManifestDeltaProposal proposal = new()
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
