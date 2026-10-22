using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputLlmSemanticJudge
{
    /// <summary>
    ///     Product rule: Topology, Critic, Cost, and Compliance run the rubric judge when enabled (TB-190 judge sub-cap).
    /// </summary>
    internal static bool IsLlmJudgeEligibleAgentType(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Critic or AgentType.Cost or AgentType.Compliance;

    private async Task<bool> PassesEligibilityGatesAsync(
        AgentOutputLlmSemanticJudgeOptions judgeOpts,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        if (!judgeOpts.Enabled)
            return false;

        if (!IsLlmJudgeEligibleAgentType(agentType))
            return false;

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        await using (AsyncServiceScope budgetScope = _scopeFactory.CreateAsyncScope())
        {
            ILlmJudgeBudgetTracker judgeBudgetTracker =
                budgetScope.ServiceProvider.GetRequiredService<ILlmJudgeBudgetTracker>();

            if (!await judgeBudgetTracker.TryPeekWithinBudgetAsync(tenantId, cancellationToken).ConfigureAwait(false))
            {
                judgeBudgetTracker.RecordBudgetExhausted();

                return false;
            }
        }

        AgentExecutionOptions exec = _agentExecutionOptions.CurrentValue;

        if (judgeOpts.SkipWhenSimulator
            && string.Equals(exec.Mode.Trim(), "Simulator", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }
}
