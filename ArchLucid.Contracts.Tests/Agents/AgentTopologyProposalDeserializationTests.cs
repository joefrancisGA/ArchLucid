using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "proposalId": "p1",
              "sourceAgent": 1,
              "addedServices": null,
              "addedDatastores": null,
              "addedRelationships": null,
              "requiredControls": null,
              "warnings": null
            }
            """;

        AgentTopologyProposal proposal = JsonSerializer.Deserialize<AgentTopologyProposal>(json, ContractJson.Default)!;

        proposal.AddedServices.Should().NotBeNull().And.BeEmpty();
        proposal.AddedDatastores.Should().NotBeNull().And.BeEmpty();
        proposal.AddedRelationships.Should().NotBeNull().And.BeEmpty();
        proposal.RequiredControls.Should().NotBeNull().And.BeEmpty();
        proposal.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
