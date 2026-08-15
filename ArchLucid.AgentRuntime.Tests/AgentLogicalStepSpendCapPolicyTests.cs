using ArchLucid.AgentRuntime;

using ArchLucid.Core;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentLogicalStepSpendCapPolicyTests
{
    [Fact]
    public void ResolveMaxBilledAttempts_uses_documented_formula_when_override_is_zero()
    {
        AgentLogicalStepSpendCapOptions cap = new() { MaxBilledCompletionAttemptsPerTask = 0 };
        AgentSchemaRemediationOptions schema = new() { MaxCompletionAttempts = 3 };
        AgentExecutionResilienceOptions resilience = new() { LlmCallMaxRetryAttempts = 2 };

        int resolved = AgentLogicalStepSpendCapOptions.ResolveMaxBilledAttempts(cap, schema, resilience);

        resolved.Should().Be(6);
    }

    [Fact]
    public void EnsureBilledAttemptAllowed_throws_after_cap_within_active_scope()
    {
        AgentLogicalStepSpendCapPolicy policy = new(
            FixedOptionsMonitor.For(new AgentLogicalStepSpendCapOptions
            {
                Enabled = true,
                MaxBilledCompletionAttemptsPerTask = 2,
            }),
            FixedOptionsMonitor.For(new AgentSchemaRemediationOptions()),
            FixedOptionsMonitor.For(new AgentExecutionResilienceOptions()));

        using (AgentLogicalStepSpendScope.Begin("run-1", "task-1"))
        {
            policy.EnsureBilledAttemptAllowed();
            policy.EnsureBilledAttemptAllowed();

            Action act = () => policy.EnsureBilledAttemptAllowed();

            act.Should().Throw<AgentLogicalStepSpendCapExceededException>();
        }
    }

    private static class FixedOptionsMonitor
    {
        public static IOptionsMonitor<T> For<T>(T value)
            where T : class
        {
            return new Monitor<T>(value);
        }

        private sealed class Monitor<T> : IOptionsMonitor<T>
            where T : class
        {
            private readonly T _value;

            public Monitor(T value)
            {
                _value = value;
            }

            public T CurrentValue => _value;

            public T Get(string? name) => _value;

            public IDisposable OnChange(Action<T, string?> listener) => EmptyDisposable.Instance;
        }

        private sealed class EmptyDisposable : IDisposable
        {
            public static readonly EmptyDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
