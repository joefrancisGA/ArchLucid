using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Deterministic keys for the self-service <c>SeedTrialWelcomeRunAsync</c> ecommerce welcome sample (tenant-isolated
///     PKs in shared SQL catalogs).
/// </summary>
internal static class TrialWelcomeSeedIds
{
    internal static Guid AnalysisArtifactId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.TrialWelcome.AnalysisArtifact", authorityRunId.ToString("N"));
    }

    internal static Guid ArtifactBundleId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.TrialWelcome.ArtifactBundle", authorityRunId.ToString("N"));
    }

    private static Guid DeriveGuid(string purpose, string segment)
    {
        StringBuilder builder = new();
        builder.Append(purpose);
        builder.Append('\u001e');
        builder.Append(segment);

        byte[] utf8 = Encoding.UTF8.GetBytes(builder.ToString());
        using SHA256 sha = SHA256.Create();
        byte[] hash = sha.ComputeHash(utf8);
        Span<byte> guidBytes = stackalloc byte[16];
        hash.AsSpan(0, 16).CopyTo(guidBytes);

        return new Guid(guidBytes);
    }
}
