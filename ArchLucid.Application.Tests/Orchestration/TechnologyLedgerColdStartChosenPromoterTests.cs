using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerColdStartChosenPromoterTests
{
    [Fact]
    public void Apply_promotes_first_agent_proposal_to_chosen_when_role_has_no_chosen_row()
    {
        TechnologyLedgerEntry candidate = new()
        {
            RunId = "run-1",
            Role = TechnologyLedgerRole.ComputeRuntime,
            TechnologyName = "Azure App Service",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Assumed,
            Source = TechnologyLedgerSource.AgentProposed,
        };

        TechnologyLedgerEntry promoted = TechnologyLedgerColdStartChosenPromoter.Apply(
            candidate,
            [
                new TechnologyLedgerEntry
                {
                    RunId = "run-1",
                    Role = TechnologyLedgerRole.CloudPlatform,
                    TechnologyName = "Microsoft Azure",
                    ProviderFamily = CloudProvider.Azure,
                    Status = TechnologyLedgerStatus.Chosen,
                    Source = TechnologyLedgerSource.User,
                },
            ]);

        promoted.Status.Should().Be(TechnologyLedgerStatus.Chosen);
        promoted.Rationale.Should().Contain("Cold-start");
    }

    [Fact]
    public void Apply_keeps_assumed_when_role_already_has_chosen_row()
    {
        TechnologyLedgerEntry candidate = new()
        {
            RunId = "run-1",
            Role = TechnologyLedgerRole.ComputeRuntime,
            TechnologyName = "Azure Functions",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Assumed,
            Source = TechnologyLedgerSource.AgentProposed,
        };

        TechnologyLedgerEntry result = TechnologyLedgerColdStartChosenPromoter.Apply(
            candidate,
            [
                new TechnologyLedgerEntry
                {
                    RunId = "run-1",
                    Role = TechnologyLedgerRole.ComputeRuntime,
                    TechnologyName = "Azure App Service",
                    ProviderFamily = CloudProvider.Azure,
                    Status = TechnologyLedgerStatus.Chosen,
                    Source = TechnologyLedgerSource.User,
                },
            ]);

        result.Status.Should().Be(TechnologyLedgerStatus.Assumed);
    }
}
