namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>
///     Decides whether closed-loop publish may merge authority findings after the trust publish gate.
/// </summary>
public static class ClosedLoopPublishMergeGate
{
    /// <summary>
    ///     Returns <see langword="true" /> only when publish is not blocked and the caller requested product publish.
    /// </summary>
    /// <remarks>
    ///     <paramref name="publishToProductRequested" /> is a requested outcome, not an authorization decision.
    ///     Authorization is <paramref name="publishBlocked" />, evaluated first (fail closed).
    /// </remarks>
    public static bool ShouldMergeAuthorityFindings(bool publishBlocked, bool publishToProductRequested)
    {
        if (publishBlocked)
        {
            return false;
        }

        // codeql[cs/user-controlled-bypass]
        return publishToProductRequested;
    }
}
