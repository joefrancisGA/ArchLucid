using System.IO;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

internal static class FindingInspectReadModelMapper
{
    public static FindingSeverity ParseFindingSeverity(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        string? normalized = FindingInspectReadRepositoryCore.NormalizeInspectEnumToken(raw);

        if (normalized is null)
            return FindingSeverity.Info;

        if (!global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(normalized, ignoreCase: true, out FindingSeverity sev))
            throw new InvalidDataException($"Stored finding severity '{normalized}' is invalid.");

        return sev;
    }

    public static FindingHumanReviewStatus ParseHumanReview(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingHumanReviewStatus.NotRequired;

        string? normalized = FindingInspectReadRepositoryCore.NormalizeInspectEnumToken(raw);

        if (normalized is null)
            return FindingHumanReviewStatus.NotRequired;

        if (!global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(normalized, ignoreCase: true, out FindingHumanReviewStatus status))
            throw new InvalidDataException($"Stored human review status '{normalized}' is invalid.");

        return status;
    }

    public static FindingConfidenceLevel? TryParseEvaluationConfidenceLevel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string? normalized = FindingInspectReadRepositoryCore.NormalizeInspectEnumToken(raw);

        if (normalized is null)
            return null;

        if (!global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(normalized, ignoreCase: true, out FindingConfidenceLevel lvl))
            return null;

        return lvl;
    }

    public static FindingDisposition? ParseDisposition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string? normalized = FindingInspectReadRepositoryCore.NormalizeInspectEnumToken(raw);

        if (normalized is null)
            return null;

        if (!global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(normalized, ignoreCase: true, out FindingDisposition disposition))
            return null;

        return disposition;
    }
}
