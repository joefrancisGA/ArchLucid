using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerObjectiveComposerTests
{
    [Fact]
    public void BuildTopologyObjective_uses_aws_label_when_request_is_aws()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Environment = "prod",
            Description = "desc",
            CloudProvider = CloudProvider.Aws,
        };

        string objective = TechnologyLedgerObjectiveComposer.BuildTopologyObjective(request, []);

        objective.Should().Contain("AWS");
        objective.Should().NotContain("Azure");
    }

    [Fact]
    public void BuildTopologyObjective_prefers_ledger_chosen_cloud_platform_over_request()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Environment = "prod",
            Description = "desc",
            CloudProvider = CloudProvider.Azure,
        };

        List<TechnologyLedgerEntry> ledger =
        [
            new()
            {
                RunId = "run-1",
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Amazon Web Services",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
        ];

        string objective = TechnologyLedgerObjectiveComposer.BuildTopologyObjective(request, ledger);

        objective.Should().Contain("AWS");
        objective.Should().NotContain("Azure");
    }
}
