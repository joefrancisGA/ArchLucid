using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Maps an <see cref="ArchitectureFinding" /> together with its execution context to a
///     <see cref="FindingTrustSummary" /> for display in operator UI and sponsor exports.
/// </summary>
public interface IFindingTrustLabelMapper
{
    /// <summary>
    ///     Resolves the trust label for a single finding.
    /// </summary>
    /// <param name="finding">The finding to label (must not be null).</param>
    /// <param name="context">Execution context from the producing agent result.</param>
    /// <returns>A <see cref="FindingTrustSummary" /> with label and short reason for UI display.</returns>
    FindingTrustSummary Map(ArchitectureFinding finding, AgentTrustContext context);
}
