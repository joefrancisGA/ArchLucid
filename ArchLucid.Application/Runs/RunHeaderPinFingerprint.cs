using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-10 suggestion 93: uppercase hex digests stamped on graph context nodes for reuse validation.
/// </summary>
public static class RunHeaderPinFingerprint
{
    public static string? ToHexOrNull(byte[]? hash) =>
        hash is { Length: > 0 } bytes ? Convert.ToHexString(bytes) : null;
}
