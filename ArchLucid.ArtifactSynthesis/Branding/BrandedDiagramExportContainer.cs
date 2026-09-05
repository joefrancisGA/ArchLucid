using System.Buffers.Binary;
using System.Text;

namespace ArchLucid.ArtifactSynthesis.Branding;

/// <summary>
///     Length-prefixed export container that embeds tenant logo checksum and company name around a raw PNG payload.
/// </summary>
public static class BrandedDiagramExportContainer
{
    public const int LogoChecksumSha256Length = 32;

    private static ReadOnlySpan<byte> Magic => "ALBD"u8;

    private const byte FormatVersion = 1;

    public static byte[] Wrap(byte[] renderedPng, string companyDisplayName, byte[] logoChecksumSha256)
    {
        ArgumentNullException.ThrowIfNull(renderedPng);
        ArgumentException.ThrowIfNullOrWhiteSpace(companyDisplayName);

        if (logoChecksumSha256 is null || logoChecksumSha256.Length != LogoChecksumSha256Length)
        {
            throw new ArgumentException(
                $"Logo checksum must be {LogoChecksumSha256Length} bytes.",
                nameof(logoChecksumSha256));
        }

        byte[] companyNameBytes = Encoding.UTF8.GetBytes(companyDisplayName.Trim());

        if (companyNameBytes.Length > ushort.MaxValue)
            throw new ArgumentException("Company display name is too long for the branded export container.");

        int payloadLength = Magic.Length + 1 + 2 + companyNameBytes.Length + LogoChecksumSha256Length + 4 + renderedPng.Length;
        byte[] payload = new byte[payloadLength];
        int offset = 0;

        Magic.CopyTo(payload.AsSpan(offset));
        offset += Magic.Length;

        payload[offset++] = FormatVersion;

        BinaryPrimitives.WriteUInt16LittleEndian(payload.AsSpan(offset), (ushort)companyNameBytes.Length);
        offset += 2;

        companyNameBytes.CopyTo(payload.AsSpan(offset));
        offset += companyNameBytes.Length;

        logoChecksumSha256.CopyTo(payload.AsSpan(offset));
        offset += LogoChecksumSha256Length;

        BinaryPrimitives.WriteInt32LittleEndian(payload.AsSpan(offset), renderedPng.Length);
        offset += 4;

        renderedPng.CopyTo(payload.AsSpan(offset));

        return payload;
    }

    public static bool IsBrandedExportContainer(ReadOnlySpan<byte> payload) =>
        payload.Length >= Magic.Length + 1 + 2 + LogoChecksumSha256Length + 4 &&
        payload.Slice(0, Magic.Length).SequenceEqual(Magic) &&
        payload[Magic.Length] == FormatVersion;

    public static byte[]? TryReadLogoChecksumSha256(ReadOnlySpan<byte> payload)
    {
        if (!IsBrandedExportContainer(payload))
            return null;

        int offset = Magic.Length + 1;
        ushort companyNameLength = BinaryPrimitives.ReadUInt16LittleEndian(payload.Slice(offset));
        offset += 2 + companyNameLength;

        if (payload.Length < offset + LogoChecksumSha256Length)
            return null;

        return payload.Slice(offset, LogoChecksumSha256Length).ToArray();
    }

    public static byte[]? TryExtractInnerPng(ReadOnlySpan<byte> payload)
    {
        if (!IsBrandedExportContainer(payload))
            return null;

        int offset = Magic.Length + 1;
        ushort companyNameLength = BinaryPrimitives.ReadUInt16LittleEndian(payload.Slice(offset));
        offset += 2 + companyNameLength + LogoChecksumSha256Length;

        if (payload.Length < offset + 4)
            return null;

        int pngLength = BinaryPrimitives.ReadInt32LittleEndian(payload.Slice(offset));
        offset += 4;

        if (pngLength < 0 || payload.Length < offset + pngLength)
            return null;

        return payload.Slice(offset, pngLength).ToArray();
    }
}
