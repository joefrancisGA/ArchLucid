using ArchLucid.Contracts.Common;
using ArchLucid.Core.Llm;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Llm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmAccountingInvocationScopeTests
{
    [Fact]
    public async Task Nested_scope_restores_outer_invocation_after_await()
    {
        LlmAccountingInvocationScope? initial = LlmAccountingInvocationScope.GetCurrent();
        using (LlmAccountingInvocationScope.Begin(AgentType.Topology))
        {
            using (LlmAccountingInvocationScope.Begin(LlmInvokeKind.SemanticJudge, AgentType.Critic))
            {
                await Task.Yield();
                LlmAccountingInvocationScope.GetCurrent()!.Value.InvokeKind.Should().Be(LlmInvokeKind.SemanticJudge);
            }

            LlmAccountingInvocationScope.GetCurrent()!.Value.AgentKind.Should().Be(AgentType.Topology);
            LlmAccountingInvocationScope.GetCurrent()!.Value.InvokeKind.Should().Be(LlmInvokeKind.Primary);
        }

        LlmAccountingInvocationScope.GetCurrent().Should().Be(initial);
    }
}
