using System.ComponentModel;

using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RegisteredAgentHandlersInspectorTests
{
    [Fact]
    public void ListHandlers_null_collection_throws()
    {
        Action act = () => new RegisteredAgentHandlersInspector(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ListHandlers_orders_by_agent_type_key_and_maps_metadata()
    {
        RegisteredAgentHandlersInspector sut = new([new ZebraHandler(), new AlphaHandler()]);

        IReadOnlyList<RegisteredAgentHandlerInfo> items = sut.ListHandlers();

        items.Should().HaveCount(2);
        items[0].AgentTypeKey.Should().Be("alpha");
        items[1].AgentTypeKey.Should().Be("zebra");
        items[0].AgentType.Should().Be(AgentType.Compliance.ToString());
        items[0].ImplementationTypeName.Should().Contain(nameof(AlphaHandler));
        items[0].AssemblyName.Should().NotBeNullOrWhiteSpace();
        items[0].AssemblyVersion.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void ListHandlers_includes_description_attribute_when_present()
    {
        RegisteredAgentHandlersInspector sut = new([new DescribedHandler()]);

        IReadOnlyList<RegisteredAgentHandlerInfo> items = sut.ListHandlers();

        items.Should().ContainSingle();
        items[0].Description.Should().Be("Test handler description");
    }

    private sealed class AlphaHandler : IAgentHandler
    {
        public AgentType AgentType => AgentType.Compliance;

        public string AgentTypeKey => "alpha";

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }
    }

    private sealed class ZebraHandler : IAgentHandler
    {
        public AgentType AgentType => AgentType.Topology;

        public string AgentTypeKey => "zebra";

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }
    }

    [Description("Test handler description")]
    private sealed class DescribedHandler : IAgentHandler
    {
        public AgentType AgentType => AgentType.Topology;

        public string AgentTypeKey => "described";

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }
    }
}
