namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal enum RuntimeEvidenceKind
{
    Configured,
    Installed,
    Executing,
    PlatformRollout,
}

internal enum RuntimePatchStatus
{
    Unknown,
    Compliant,
    NonCompliant,
}

/// <summary>
/// One version observation. Verification must be established by the trusted evidence adapter,
/// not by a user-supplied assertion. Instance identity must include the deployment generation.
/// </summary>
internal sealed record RuntimeVersionEvidence(
    string TenantId,
    string ResourceId,
    string InstanceId,
    string RuntimeFamily,
    RuntimeEvidenceKind Kind,
    string Version,
    DateTimeOffset ObservedAt,
    bool Verified);

/// <summary>
/// A point-in-time, verified inventory of the executing instances in scope.
/// A successful verdict requires every listed instance to have current executing evidence.
/// </summary>
internal sealed record RuntimeInstanceScope(
    string TenantId,
    string ResourceId,
    string RuntimeFamily,
    IReadOnlyCollection<string> InstanceIds,
    DateTimeOffset ObservedAt,
    bool Verified,
    bool Complete);

internal sealed record RuntimePatchAssessment(RuntimePatchStatus Status, string Reason);

/// <summary>
/// Evaluates a numeric minimum fixed version for one explicitly selected runtime release line.
/// Callers must establish advisory applicability, release-line semantics and an authoritative
/// minimum first. This evaluator is not a general package-version or vulnerability matcher.
/// </summary>
internal static class RuntimePatchEvidenceEvaluator
{
    public static RuntimePatchAssessment Evaluate(
        RuntimeInstanceScope scope,
        string minimumFixedVersion,
        IReadOnlyCollection<RuntimeVersionEvidence> evidence,
        DateTimeOffset now,
        TimeSpan maximumAge)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(evidence);

        if (maximumAge <= TimeSpan.Zero
            || string.IsNullOrWhiteSpace(scope.TenantId)
            || string.IsNullOrWhiteSpace(scope.ResourceId)
            || string.IsNullOrWhiteSpace(scope.RuntimeFamily)
            || !TryParseVersion(minimumFixedVersion, out Version minimum)
            || !scope.Verified
            || !IsCurrent(scope.ObservedAt, now, maximumAge)
            || scope.InstanceIds is null
            || scope.InstanceIds.Count == 0
            || scope.InstanceIds.Any(string.IsNullOrWhiteSpace))
        {
            return Unknown("Missing or invalid verified runtime scope or fixed version.");
        }

        bool incomplete = !scope.Complete;
        foreach (string instanceId in scope.InstanceIds.Distinct(StringComparer.Ordinal))
        {
            RuntimeVersionEvidence[] observations = evidence.Where(item =>
                item is not null
                && item.Verified
                && item.Kind == RuntimeEvidenceKind.Executing
                && string.Equals(item.TenantId, scope.TenantId, StringComparison.Ordinal)
                && string.Equals(item.ResourceId, scope.ResourceId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.InstanceId, instanceId, StringComparison.Ordinal)
                && string.Equals(item.RuntimeFamily, scope.RuntimeFamily, StringComparison.OrdinalIgnoreCase)
                && IsCurrent(item.ObservedAt, now, maximumAge)).ToArray();

            if (observations.Length == 0)
            {
                incomplete = true;
                continue;
            }

            DateTimeOffset latest = observations.Max(item => item.ObservedAt);
            Version? observed = null;
            bool ambiguous = false;
            foreach (RuntimeVersionEvidence item in observations.Where(item => item.ObservedAt == latest))
            {
                if (!TryParseVersion(item.Version, out Version parsed)
                    || parsed.Major != minimum.Major
                    || (observed is not null && observed != parsed))
                {
                    ambiguous = true;
                    break;
                }

                observed = parsed;
            }

            if (ambiguous || observed is null)
            {
                incomplete = true;
                continue;
            }

            if (observed < minimum)
            {
                return new(RuntimePatchStatus.NonCompliant,
                    "A scoped instance has verified executing evidence below the fixed version.");
            }
        }

        return incomplete
            ? Unknown("Verified executing evidence is incomplete, stale, ambiguous or out of scope.")
            : new(RuntimePatchStatus.Compliant,
                "Every instance in the verified complete scope meets the selected minimum.");
    }

    private static RuntimePatchAssessment Unknown(string reason) => new(RuntimePatchStatus.Unknown, reason);

    private static bool IsCurrent(DateTimeOffset captured, DateTimeOffset now, TimeSpan maximumAge) =>
        captured <= now && now - captured <= maximumAge;

    private static bool TryParseVersion(string? value, out Version version)
    {
        version = new Version(0, 0, 0, 0);
        if (string.IsNullOrWhiteSpace(value)
            || value.Split('.').Length is < 3 or > 4
            || value.Any(character => character != '.' && (character < '0' || character > '9'))
            || !Version.TryParse(value, out Version? parsed)
            || parsed is null)
        {
            return false;
        }

        version = new Version(parsed.Major, parsed.Minor, parsed.Build, Math.Max(0, parsed.Revision));
        return true;
    }
}
