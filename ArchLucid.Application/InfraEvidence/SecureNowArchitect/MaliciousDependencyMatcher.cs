namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal enum DependencyEvidenceKind { Declared, Resolved, Installed }
internal enum DependencyMatchState { Affected, NotMatched, Unknown }

internal sealed record DependencyObservation(
    string Ecosystem, string Package, string? Version, DependencyEvidenceKind Kind,
    string EvidenceId, DateTimeOffset ObservedAt);

internal sealed record VerifiedMaliciousVersion(
    string Ecosystem, string Package, string Version, string AdvisoryId,
    Uri Source, DateTimeOffset VerifiedAt, DateTimeOffset ValidUntil);

internal sealed record DependencyMatch(
    DependencyMatchState State, IReadOnlyList<string> AdvisoryIds, string EvidenceId);

internal static class MaliciousDependencyMatcher
{
    // Exact versions only: upstream verification must expand ranges using the
    // ecosystem's own version rules. Unsupported forms remain unknown.
    public static DependencyMatch Assess(DependencyObservation observation,
        IReadOnlyList<VerifiedMaliciousVersion> advisories, DateTimeOffset now,
        bool catalogComplete)
    {
        ArgumentNullException.ThrowIfNull(observation);
        ArgumentNullException.ThrowIfNull(advisories);
        var ecosystem = observation.Ecosystem.Trim().ToLowerInvariant();
        var package = NormalizePackage(ecosystem, observation.Package);
        var version = observation.Version?.Trim();
        DependencyMatch Result(DependencyMatchState state, string[]? ids = null) =>
            new(state, ids ?? [], observation.EvidenceId);
        if (package is null || !IsExactVersion(version) ||
            observation.Kind is not (DependencyEvidenceKind.Resolved or DependencyEvidenceKind.Installed) ||
            string.IsNullOrWhiteSpace(observation.EvidenceId) || observation.ObservedAt > now)
            return Result(DependencyMatchState.Unknown);

        var relevant = advisories.Where(a =>
            string.Equals(a.Ecosystem.Trim(), ecosystem, StringComparison.OrdinalIgnoreCase) &&
            NormalizePackage(ecosystem, a.Package) == package).ToArray();
        bool Current(VerifiedMaliciousVersion a) =>
            a.Source is { IsAbsoluteUri: true } && a.Source.Scheme == Uri.UriSchemeHttps &&
            !string.IsNullOrWhiteSpace(a.AdvisoryId) && a.VerifiedAt <= now &&
            a.ValidUntil >= now && IsExactVersion(a.Version);
        var ids = relevant.Where(a => Current(a) &&
                string.Equals(a.Version, version, StringComparison.Ordinal))
            .Select(a => a.AdvisoryId.Trim().ToUpperInvariant())
            .Distinct(StringComparer.Ordinal).OrderBy(a => a, StringComparer.Ordinal).ToArray();
        if (ids.Length > 0) return Result(DependencyMatchState.Affected, ids);
        if (!catalogComplete || relevant.Any(a => !Current(a)))
            return Result(DependencyMatchState.Unknown);
        // NotMatched is not a claim that the package is safe.
        return Result(DependencyMatchState.NotMatched);
    }

    private static bool IsExactVersion(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        System.Text.RegularExpressions.Regex.IsMatch(value,
            @"\A[0-9][0-9A-Za-z.+!_-]{0,127}\z",
            System.Text.RegularExpressions.RegexOptions.CultureInvariant);

    private static string? NormalizePackage(string ecosystem, string name)
    {
        var value = name.Trim();
        if (value.Length == 0) return null;
        return ecosystem switch
        {
            "pypi" when System.Text.RegularExpressions.Regex.IsMatch(value,
                @"\A[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?\z") =>
                System.Text.RegularExpressions.Regex.Replace(value.ToLowerInvariant(), @"[-_.]+", "-"),
            // NuGet/npm version semantics require dedicated comparators.
            _ => null
        };
    }
}
