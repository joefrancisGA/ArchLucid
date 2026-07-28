namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureIntelligenceBudgetDecision
{
    private ArchitectureIntelligenceBudgetDecision(
        bool permitted,
        int estimatedTokens,
        int maxTokens,
        string? rejectReason)
    {
        Permitted = permitted;
        EstimatedTokens = estimatedTokens;
        MaxTokens = maxTokens;
        RejectReason = rejectReason;
    }

    public bool Permitted
    {
        get;
    }

    public int EstimatedTokens
    {
        get;
    }

    public int MaxTokens
    {
        get;
    }

    public string? RejectReason
    {
        get;
    }

    public static ArchitectureIntelligenceBudgetDecision Permit(int estimatedTokens, int maxTokens) =>
        new(true, estimatedTokens, maxTokens, null);

    public static ArchitectureIntelligenceBudgetDecision Reject(
        int estimatedTokens,
        int maxTokens,
        string reason) =>
        new(false, estimatedTokens, maxTokens, reason);
}
