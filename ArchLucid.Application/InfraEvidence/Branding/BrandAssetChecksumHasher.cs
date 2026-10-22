using System.Security.Cryptography;

namespace ArchLucid.Application.InfraEvidence.Branding;

public static class BrandAssetChecksumHasher
{
    public static byte[] ComputeSha256(byte[] assetBytes) => SHA256.HashData(assetBytes);
}
