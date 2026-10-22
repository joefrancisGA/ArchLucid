using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Drafts;

/// <summary>
///     Content-addresses draft document JSON for revision pinning (wave-3 suggestion 25).
/// </summary>
public static class DraftDocumentContentFingerprint
{
    private static readonly JsonSerializerOptions CanonicalOptions = ContractJson.CamelCaseIgnoreNullCompact;

    public static byte[] Compute(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string canonical = JsonSerializer.Serialize(document, CanonicalOptions);

        return SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(canonical));
    }

    public static bool SequenceEqual(byte[]? left, byte[]? right)
    {
        if (left is null || right is null)
            return left is null && right is null;

        return left.AsSpan().SequenceEqual(right);
    }
}
