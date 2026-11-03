using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class SecurityEvidencePathRankContextBuilder
{
    public const string NoNextStoredPathSentence =
        "No next stored path is available. This does not change the rank.";

    public static string BuildNextStoredPathRankContext(
        Guid selectedPathId,
        IReadOnlyList<SecurityEvidencePathRankRecord> orderedRanks)
    {
        if (orderedRanks.Count == 0)
        {
            return NoNextStoredPathSentence;
        }

        SecurityEvidencePathRankRecord[] ordered = orderedRanks
            .OrderBy(rank => rank.RankOrder)
            .ToArray();
        int selectedIndex = Array.FindIndex(ordered, rank => rank.PathId == selectedPathId);

        if (selectedIndex < 0 || selectedIndex + 1 >= ordered.Length)
        {
            return NoNextStoredPathSentence;
        }

        SecurityEvidencePathRankRecord selected = ordered[selectedIndex];
        SecurityEvidencePathRankRecord next = ordered[selectedIndex + 1];
        (string Name, decimal Gap)[] dimensions =
        [
            ("TechnicalExposure", selected.TechnicalExposureScore - next.TechnicalExposureScore),
            ("PrivilegeDepth", selected.PrivilegeDepthScore - next.PrivilegeDepthScore),
            ("BlastRadius", selected.BlastRadiusScore - next.BlastRadiusScore),
            ("BusinessConsequence", (selected.BusinessConsequenceScore ?? 0m) - (next.BusinessConsequenceScore ?? 0m)),
            ("ConfidenceBand", selected.ConfidenceBandScore - next.ConfidenceBandScore),
        ];
        (string Name, decimal Gap)? largest = dimensions
            .Where(dimension => dimension.Gap > 0)
            .OrderByDescending(dimension => dimension.Gap)
            .FirstOrDefault();

        return largest is { } dimension
            ? $"Selected path {selected.PathId:D} outranks stored path {next.PathId:D} on {dimension.Name}. This does not change the rank."
            : $"Selected path {selected.PathId:D} does not outrank stored path {next.PathId:D} on a stored dimension. This does not change the rank.";
    }
}
