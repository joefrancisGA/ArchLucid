namespace ArchLucid.Host.Core.Services;

/// <summary>
///     Thread-safe in-memory ring buffer for recent IdP JWT claim-mapping failures.
///     Exposed to admins via <c>GET /v1/admin/auth-diagnostics</c>.
///     No PII or raw token material is retained — only safe metadata attributes.
/// </summary>
public interface IAuthDiagnosticsRingBuffer
{
    /// <summary>Records a mapping failure entry, evicting the oldest when the buffer is full.</summary>
    void Record(AuthDiagnosticEntry entry);

    /// <summary>Returns the most recent entries, newest last, capped to <paramref name="maxCount" />.</summary>
    IReadOnlyList<AuthDiagnosticEntry> GetRecent(int maxCount = 50);
}
