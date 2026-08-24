using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Pure finding-to-evidence linkage checks for high-severity findings (assessment evidence graph substrate).
/// </summary>
public interface IFindingEvidenceLinkageFindingEngine
{
    IReadOnlyList<Finding> Evaluate(string runId, IReadOnlyList<Finding> findings);
}
