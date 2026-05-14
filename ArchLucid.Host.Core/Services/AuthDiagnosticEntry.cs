namespace ArchLucid.Host.Core.Services;

/// <summary>
///     A single captured authentication mapping failure, retained in the in-memory ring buffer
///     exposed by <see cref="IAuthDiagnosticsRingBuffer" />.
///     Only safe, non-PII metadata is stored — no raw tokens, secrets, or full claim values.
/// </summary>
public sealed class AuthDiagnosticEntry
{
    /// <summary>UTC instant the mapping failure was captured.</summary>
    public DateTime TimestampUtc { get; init; }

    /// <summary>Token issuer (<c>iss</c>) claim, if present.</summary>
    public string? Issuer { get; init; }

    /// <summary>Token audience (<c>aud</c>) claim(s), if present.</summary>
    public string? Audience { get; init; }

    /// <summary>Token subject (<c>sub</c>) claim, safe prefix only (first 8 characters).</summary>
    public string? SubjectPrefix { get; init; }

    /// <summary>Claim types present in the token that ArchLucid role mapping inspects.</summary>
    public IReadOnlyList<string> PresentClaimTypes { get; init; } = [];

    /// <summary>Role claim values found in the token (claim values, not raw JWT bytes).</summary>
    public IReadOnlyList<string> RoleClaimValues { get; init; } = [];

    /// <summary>Human-readable reason why role mapping produced no known ArchLucid role.</summary>
    public string Reason { get; init; } = string.Empty;
}
