using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingInspectTrustContextResolverTests
{
    [Fact]
    public void Resolve_SimulatorRun_MarksSimulatorDerivedContext()
    {
        FindingInspectResponse response = new()
        {
            RunStructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);

        context.IsSimulatorDerived.Should().BeTrue();
        context.IsRealModel.Should().BeFalse();
    }

    [Fact]
    public void Resolve_FallbackRun_MarksDegradedContext()
    {
        FindingInspectResponse response = new()
        {
            RunStructuralExecutionMode = StructuralExecutionMode.Fallback,
            RunRealModeFellBackToSimulator = true,
        };

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);

        context.IsDegraded.Should().BeTrue();
        context.IsRealModel.Should().BeFalse();
    }

    [Fact]
    public void Resolve_LlmResourceFallbackDeployment_MarksDegradedContext()
    {
        FindingInspectResponse response = new()
        {
            RunStructuralExecutionMode = StructuralExecutionMode.Real,
            ModelDeploymentName = $"{AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix}gpt-4",
        };

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);

        context.IsDegraded.Should().BeTrue();
        context.IsRealModel.Should().BeFalse();
    }
}
