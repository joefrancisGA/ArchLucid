using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

/// <summary>Estimates batch USD/tokens for TB-939 pre-batch admission.</summary>
public static class RunAgentBatchBudgetEstimator
{
    public static decimal EstimateBatchUsd(
        int agentTaskCount,
        int assumedCallsPerAgentTask,
        decimal assumedUsdPerCall)
    {
        if (agentTaskCount < 0)
            throw new ArgumentOutOfRangeException(nameof(agentTaskCount));

        if (assumedCallsPerAgentTask < 0)
            throw new ArgumentOutOfRangeException(nameof(assumedCallsPerAgentTask));

        if (assumedUsdPerCall < 0m)
            throw new ArgumentOutOfRangeException(nameof(assumedUsdPerCall));

        if (agentTaskCount == 0 || assumedCallsPerAgentTask == 0 || assumedUsdPerCall == 0m)
            return 0m;

        return agentTaskCount * assumedCallsPerAgentTask * assumedUsdPerCall;
    }

    public static long EstimateBatchTokens(
        int agentTaskCount,
        int assumedCallsPerAgentTask,
        int assumedPromptTokensPerCall,
        int assumedCompletionTokensPerCall)
    {
        if (agentTaskCount < 0)
            throw new ArgumentOutOfRangeException(nameof(agentTaskCount));

        if (assumedCallsPerAgentTask < 0)
            throw new ArgumentOutOfRangeException(nameof(assumedCallsPerAgentTask));

        long perCall = (long)Math.Max(0, assumedPromptTokensPerCall) + Math.Max(0, assumedCompletionTokensPerCall);
        return (long)agentTaskCount * assumedCallsPerAgentTask * perCall;
    }

    public static decimal ApplyGrace(decimal hardCapUsd, decimal gracePercent) =>
        RunScopedLlmBudgetGrace.ApplyGrace(hardCapUsd, gracePercent);
}
