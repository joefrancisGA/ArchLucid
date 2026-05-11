using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Builds a short, template-based reasoning narrative for the finding inspector read-model.
/// </summary>
public interface IReasoningSummaryBuilder
{
    /// <summary>
    ///     Returns a human-readable summary when rule, evidence, and remediation hints are sufficient; otherwise null.
    /// </summary>
    string? TryBuild(FindingInspectResponse inspect);
}
