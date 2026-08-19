namespace ArchLucid.Host.Core.ProblemDetails;

/// <summary>
///     Audience tier for optional <c>supportHint</c> on problem+json (TB-284).
/// </summary>
public enum ProblemDetailsAudience
{
    /// <summary>Operator / integrator tier — may include route and runbook hints.</summary>
    Operator = 0,

    /// <summary>Buyer / sponsor tier — must not expose internal API topology in hints.</summary>
    Buyer = 1,
}
