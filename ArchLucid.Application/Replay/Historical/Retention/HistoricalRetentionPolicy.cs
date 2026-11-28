using ArchLucid.Application.Analysis;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;

using static ArchLucid.Application.Replay.Historical.HistoricalReplayDescriptorValidation;

namespace ArchLucid.Application.Replay.Historical.Retention;

public enum HistoricalRetentionDisposition { Unavailable, EligibleForAuthorizedPurge, PreserveForHold, Retain }
public enum HistoricalArtifactLifecycle { Unknown, Available, ErasureApproved, Erased }

public sealed record HistoricalRetentionRule(HistoricalReplayMode Mode, HistoricalArtifactRole Role, int MaximumAgeDays,
    bool AllowExactRaw, bool AllowArchiveRestore, bool AllowDerivedMetadata);

/// <summary>Project-scoped, tenant-approved matrix. An omitted row does not authorize retention or reading.</summary>
public sealed record HistoricalRetentionPolicy(ProjectScopeKey Scope, Guid ApprovalId, string Revision, string Region,
    DateTimeOffset ApprovedUtc, DateTimeOffset AuthorizationEndsUtc, IReadOnlyList<HistoricalRetentionRule> Rules);

public sealed record HistoricalArchiveRedaction(string Text, HistoricalArtifactAvailability Fidelity);

public static class HistoricalRetentionPolicyRules
{
    public const string Version = "FND096-historical-retention-policy-v1";

    public static string PolicySha256(HistoricalRetentionPolicy policy)
    {
        ArgumentNullException.ThrowIfNull(policy);
        return Freeze(policy) is { } frozen ? DigestPolicy(frozen)
            : throw new ArgumentException("Invalid historical replay retention policy.", nameof(policy));
    }

    internal static HistoricalRetentionPolicy? Freeze(HistoricalRetentionPolicy policy)
    {
        if (policy.Scope is null || policy.ApprovalId == Guid.Empty || !Token(policy.Revision) || !Token(policy.Region)
            || policy.Region == "default" || !string.Equals(policy.Region, policy.Region.ToLowerInvariant(), StringComparison.Ordinal)
            || policy.ApprovedUtc == default || policy.AuthorizationEndsUtc <= policy.ApprovedUtc || policy.Rules is null
            || policy.Rules.Count is < 1 or > 128)
            return null;
        var rows = policy.Rules.Take(129).ToArray();
        if (rows.Length > 128 || rows.Any(rule => rule is null || !Enum.IsDefined(rule.Mode) || !Enum.IsDefined(rule.Role)
            || rule.MaximumAgeDays < 1 || rule.MaximumAgeDays > (int)TimeSpan.MaxValue.TotalDays
            || (rule.AllowExactRaw && (!IsRaw(rule.Role) || rule.Mode != HistoricalReplayMode.RecordedRaw)))
            || rows.Select(row => (row.Mode, row.Role)).Distinct().Count() != rows.Length)
            return null;
        return policy with
        {
            ApprovedUtc = policy.ApprovedUtc.ToUniversalTime(), AuthorizationEndsUtc = policy.AuthorizationEndsUtc.ToUniversalTime(),
            Rules = FreezeRows(rows.OrderBy(row => row.Mode).ThenBy(row => row.Role)),
        };
    }

    internal static string DigestPolicy(HistoricalRetentionPolicy frozen) =>
        AnalysisDependencyFingerprint.Digest(new { Version, Policy = frozen });

    internal static bool IsRaw(HistoricalArtifactRole role) =>
        role is HistoricalArtifactRole.AcceptedPrompt or HistoricalArtifactRole.AcceptedRawResponse;

    internal static bool Token(string? value) => value is { Length: > 0 and <= 192 } && !string.IsNullOrWhiteSpace(value)
        && string.Equals(value, value.Trim(), StringComparison.Ordinal) && !value.Any(char.IsControl);

    /// <summary>Advisory only. Existing erasure owners control scheduling and deletions.</summary>
    public static HistoricalRetentionDisposition AssessPreservation(HistoricalArtifactLifecycle lifecycle, DateTimeOffset expiresAt,
        DateTimeOffset? artifactHoldUntil, DateTimeOffset? tenantHoldUntil, DateTimeOffset now)
    {
        if (lifecycle is not (HistoricalArtifactLifecycle.Available or HistoricalArtifactLifecycle.ErasureApproved))
            return HistoricalRetentionDisposition.Unavailable;
        if (artifactHoldUntil > now || tenantHoldUntil > now)
            return HistoricalRetentionDisposition.PreserveForHold;
        return lifecycle == HistoricalArtifactLifecycle.ErasureApproved || expiresAt <= now
            ? HistoricalRetentionDisposition.EligibleForAuthorizedPurge : HistoricalRetentionDisposition.Retain;
    }

    /// <summary>Prepare only a permitted derived representation. Existing archival policy still owns any storage write.</summary>
    public static HistoricalArchiveRedaction? PrepareDerived(HistoricalRetentionRule rule, string text, IPromptRedactor redactor)
    {
        ArgumentNullException.ThrowIfNull(rule);
        ArgumentNullException.ThrowIfNull(text);
        ArgumentNullException.ThrowIfNull(redactor);
        if (!rule.AllowDerivedMetadata || text.Length > 1_048_576)
            return null;
        var redacted = redactor.RedactAlways(text);
        return new(redacted.Text, !string.Equals(redacted.Text, text, StringComparison.Ordinal)
            ? HistoricalArtifactAvailability.Redacted : HistoricalArtifactAvailability.Derived);
    }
}
