using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

/// <summary>Guards match recording: AI proposals cannot be recorded as ExactMatch.</summary>
public static class RemediationPatternMatchGuard
{
    public static bool TryValidateRecordedMatch(
        RemediationPatternMatchKind matchKind,
        RemediationPatternMatchSource matchSource,
        out string? rejectionReason)
    {
        if (matchSource == RemediationPatternMatchSource.AIProposed
            && matchKind == RemediationPatternMatchKind.ExactMatch)
        {
            rejectionReason = "AI-proposed matches cannot be recorded as ExactMatch.";
            return false;
        }

        if (matchSource == RemediationPatternMatchSource.AIProposed
            && matchKind == RemediationPatternMatchKind.Conflict)
        {
            rejectionReason = "AI-proposed matches cannot record Conflict outcomes.";
            return false;
        }

        rejectionReason = null;
        return true;
    }

    public static bool IsEligibleForExecution(RemediationPatternMatchResultRecord? matchResult)
    {
        if (matchResult is null || !matchResult.IsActive)
            return false;

        if (matchResult.MatchKind == RemediationPatternMatchKind.Conflict)
            return false;

        return matchResult.MatchKind is RemediationPatternMatchKind.ExactMatch
            or RemediationPatternMatchKind.ProbableMatch;
    }
}

public sealed class RemediationPatternMatchCandidate
{
    public RemediationPatternApprovedVersionRecord ApprovedVersion
    {
        get;
        init;
    } = null!;

    public RemediationPatternMatchKind MatchKind
    {
        get;
        init;
    }

    public string ExplainText
    {
        get;
        init;
    } = string.Empty;
}

/// <summary>Pure deterministic matcher for operational findings to approved remediation patterns.</summary>
public static class RemediationPatternMatcher
{
    public static IReadOnlyList<RemediationPatternMatchCandidate> Evaluate(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        IReadOnlyList<RemediationPatternApprovedVersionRecord> approvedVersions)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(metadata);
        ArgumentNullException.ThrowIfNull(approvedVersions);

        List<RemediationPatternMatchCandidate> candidates = [];

        foreach (RemediationPatternApprovedVersionRecord approved in approvedVersions)
        {
            if (!RemediationPatternFactoryGuard.TryValidateForFactoryUse(approved.Version, out _))
                continue;

            if (TryClassify(finding, metadata, approved, out RemediationPatternMatchKind kind, out string explain)
                && kind != RemediationPatternMatchKind.NoMatch)
            {
                candidates.Add(new RemediationPatternMatchCandidate
                {
                    ApprovedVersion = approved,
                    MatchKind = kind,
                    ExplainText = explain,
                });
            }
        }

        return candidates
            .OrderByDescending(candidate => Rank(candidate.MatchKind))
            .ThenBy(candidate => candidate.ApprovedVersion.Pattern.PatternKey, StringComparer.Ordinal)
            .ToList();
    }

    public static bool TryResolveConflict(
        IReadOnlyList<RemediationPatternMatchCandidate> candidates,
        out RemediationPatternMatchConflictType? conflictType,
        out string? description)
    {
        List<RemediationPatternMatchCandidate> exactMatches = candidates
            .Where(candidate => candidate.MatchKind == RemediationPatternMatchKind.ExactMatch)
            .ToList();

        if (exactMatches.Count > 1)
        {
            bool samePatternDifferentVersions = exactMatches
                .Select(candidate => candidate.ApprovedVersion.Pattern.PatternId)
                .Distinct()
                .Count() == 1;

            if (samePatternDifferentVersions)
            {
                conflictType = RemediationPatternMatchConflictType.VersionSkew;
                description = "Multiple approved versions of the same pattern exact-matched the finding.";
                return true;
            }

            bool contradictory = exactMatches
                .Select(candidate => candidate.ApprovedVersion.Version.AutomationLevel)
                .Distinct()
                .Count() > 1;

            conflictType = contradictory
                ? RemediationPatternMatchConflictType.ContradictoryStrategy
                : RemediationPatternMatchConflictType.DuplicateExactMatch;

            description = contradictory
                ? "Multiple exact matches propose contradictory automation strategies."
                : "Multiple distinct patterns exact-matched the same finding.";

            return true;
        }

        conflictType = null;
        description = null;
        return false;
    }

    private static bool TryClassify(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        RemediationPatternApprovedVersionRecord approved,
        out RemediationPatternMatchKind matchKind,
        out string explainText)
    {
        RemediationPatternVersionRecord version = approved.Version;
        RemediationPatternRecord pattern = approved.Pattern;

        if (IsExactMatch(finding, version))
        {
            matchKind = RemediationPatternMatchKind.ExactMatch;
            explainText = BuildExplain(pattern.PatternKey, version.Version, "provider, resource type, and control id aligned");
            return true;
        }

        if (IsProbableMatch(finding, version))
        {
            matchKind = RemediationPatternMatchKind.ProbableMatch;
            explainText = BuildExplain(pattern.PatternKey, version.Version, "resource type and control framework aligned without control id");
            return true;
        }

        if (IsPossibleMatch(finding, metadata, version))
        {
            matchKind = RemediationPatternMatchKind.PossibleMatch;
            explainText = BuildExplain(pattern.PatternKey, version.Version, "keyword or property overlap detected");
            return true;
        }

        matchKind = RemediationPatternMatchKind.NoMatch;
        explainText = string.Empty;
        return false;
    }

    private static bool IsExactMatch(OperationalSecurityFindingRecord finding, RemediationPatternVersionRecord version)
    {
        if (!version.MatchProvider.HasValue || finding.Provider != version.MatchProvider.Value)
            return false;

        if (string.IsNullOrWhiteSpace(version.MatchResourceType)
            || !string.Equals(finding.ResourceType, version.MatchResourceType, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(version.MatchControlId)
            || string.IsNullOrWhiteSpace(finding.ControlId)
            || !string.Equals(finding.ControlId, version.MatchControlId, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return MeetsSeverityMin(finding.Severity, version.MatchSeverityMin);
    }

    private static bool IsProbableMatch(OperationalSecurityFindingRecord finding, RemediationPatternVersionRecord version)
    {
        if (!string.IsNullOrWhiteSpace(finding.ControlId))
            return false;

        if (string.IsNullOrWhiteSpace(version.MatchResourceType)
            || !string.Equals(finding.ResourceType, version.MatchResourceType, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(finding.ControlFramework)
            || string.IsNullOrWhiteSpace(version.MatchControlId))
        {
            return false;
        }

        return string.Equals(finding.ControlFramework, version.MatchControlId, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPossibleMatch(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        RemediationPatternVersionRecord version)
    {
        if (!string.IsNullOrWhiteSpace(version.MatchPropertyEqualsJson))
        {
            Dictionary<string, string>? required = JsonSerializer.Deserialize<Dictionary<string, string>>(
                version.MatchPropertyEqualsJson,
                AuditJsonSerializationOptions.Instance);

            if (required is { Count: > 0 }
                && required.All(pair => metadata.Any(row =>
                    string.Equals(row.MetadataKey, pair.Key, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(row.MetadataValue, pair.Value, StringComparison.OrdinalIgnoreCase))))
            {
                return true;
            }
        }

        string haystack = $"{finding.Title} {finding.Description} {version.ControlObjective}";

        if (!string.IsNullOrWhiteSpace(version.MatchResourceType)
            && haystack.Contains(version.MatchResourceType, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(version.MatchControlId)
            && haystack.Contains(version.MatchControlId, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static bool MeetsSeverityMin(string? findingSeverity, string? severityMin)
    {
        if (string.IsNullOrWhiteSpace(severityMin))
            return true;

        if (string.IsNullOrWhiteSpace(findingSeverity))
            return false;

        return SeverityRank(findingSeverity) >= SeverityRank(severityMin);
    }

    private static int SeverityRank(string severity) =>
        severity.Trim().ToLowerInvariant() switch
        {
            "critical" => 4,
            "high" => 3,
            "medium" => 2,
            "low" => 1,
            _ => 0,
        };

    private static int Rank(RemediationPatternMatchKind kind) =>
        kind switch
        {
            RemediationPatternMatchKind.ExactMatch => 4,
            RemediationPatternMatchKind.ProbableMatch => 3,
            RemediationPatternMatchKind.PossibleMatch => 2,
            RemediationPatternMatchKind.Conflict => 1,
            _ => 0,
        };

    private static string BuildExplain(string patternKey, string version, string because) =>
        $"Pattern {patternKey} v{version} matched because {because}.";
}
