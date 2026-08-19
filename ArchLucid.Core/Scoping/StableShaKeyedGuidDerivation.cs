using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Scoping;

/// <summary>SHA-256–keyed deterministic GUIDs whose string form equals the contiguous digest prefix interpreted as RFC 4122 hex.</summary>
internal static class StableShaKeyedGuidDerivation
{
    internal static Guid GuidFromPurposeSeparatorAndSegmentUtf8Keyed(string purpose, string segment)
    {
        if (purpose is null) throw new ArgumentNullException(nameof(purpose));

        if (segment is null) throw new ArgumentNullException(nameof(segment));

        StringBuilder builder = new();
        builder.Append(purpose);
        builder.Append('\u001e');
        builder.Append(segment);
        byte[] utf8 = Encoding.UTF8.GetBytes(builder.ToString());

        Span<byte> hash = stackalloc byte[32];

        SHA256.HashData(utf8, hash);

        return GuidFromTruncatedSha256BigEndianDigestPrefix(hash);
    }

    private static Guid GuidFromTruncatedSha256BigEndianDigestPrefix(ReadOnlySpan<byte> digest32Plus)
    {
        ReadOnlySpan<byte> prefix = digest32Plus[..16];
        uint data1 = BinaryPrimitives.ReadUInt32BigEndian(prefix[..4]);
        ushort data2 = BinaryPrimitives.ReadUInt16BigEndian(prefix.Slice(4, 2));
        ushort data3 = BinaryPrimitives.ReadUInt16BigEndian(prefix.Slice(6, 2));

        return new Guid(
            unchecked((int)data1),
            unchecked((short)data2),
            unchecked((short)data3),
            prefix[8],
            prefix[9],
            prefix[10],
            prefix[11],
            prefix[12],
            prefix[13],
            prefix[14],
            prefix[15]);
    }
}
