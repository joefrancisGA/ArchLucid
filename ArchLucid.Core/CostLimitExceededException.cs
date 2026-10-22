namespace ArchLucid.Core;

public sealed class CostLimitExceededException : Exception
{
    public CostLimitExceededException(string message, CostLimitExceededKind kind = CostLimitExceededKind.RunCostUsd)
        : base(message)
    {
        Kind = kind;
    }

    /// <summary>Whether the breach was token- or USD-based (TB-327).</summary>
    public CostLimitExceededKind Kind
    {
        get;
    }
}
