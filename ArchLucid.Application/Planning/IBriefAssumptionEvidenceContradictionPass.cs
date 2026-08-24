using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Detects confirmed assumptions contradicted by explicit evidence in the architecture overview.
/// </summary>
public interface IBriefAssumptionEvidenceContradictionPass
{
    Task<IReadOnlyList<EvidenceContradictedBriefAssumption>> DetectAsync(
        string overviewText,
        IReadOnlyList<string> confirmedAssumptions,
        CancellationToken cancellationToken);
}
