namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Raised when <see cref="IRequestContentSafetyPrecheck" /> blocks a request before run coordination or execute
///     (TB-325 — prompt-injection / instruction-override guard).
/// </summary>
public sealed class RequestContentSafetyRejectedException : Exception
{
    public RequestContentSafetyRejectedException(IReadOnlyList<string> reasons)
        : base(string.Join("; ", reasons))
    {
        Reasons = reasons ?? throw new ArgumentNullException(nameof(reasons));
    }

    /// <summary>Human-readable precheck reasons (field labels + matched phrase/family).</summary>
    public IReadOnlyList<string> Reasons
    {
        get;
    }
}
