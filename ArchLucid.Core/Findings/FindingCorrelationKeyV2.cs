using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Versioned, project- and asset-bound policy correlation candidates. Never use a key as an
///     authorization decision, a stored finding ID, or proof that two findings share a root cause.
/// </summary>
public static class FindingCorrelationKeyV2
{
    private static readonly Encoding StrictUtf8 = new UTF8Encoding(false, true);

    /// <summary>
    ///     Build a key only for a policy finding with complete inputs and a single authoritative asset.
    ///     The caller must resolve the authorized project and canonical asset from trusted evidence.
    ///     Asset keys are opaque and ordinal. This method does not resolve aliases or guess missing bindings.
    /// </summary>
    public static string? TryBuild(
        ProjectScopeKey? project,
        string? canonicalAssetKey,
        string? policyRuleId,
        string? category,
        string? text)
    {
        if (project is null
            || string.IsNullOrWhiteSpace(canonicalAssetKey)
            || canonicalAssetKey.Trim().Length != canonicalAssetKey.Length
            || string.IsNullOrWhiteSpace(policyRuleId)
            || string.IsNullOrWhiteSpace(category)
            || string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        try
        {
            using IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            hash.AppendData("archlucid/finding-correlation/v2"u8);
            AppendField(hash, project.TenantId.ToString("N"));
            AppendField(hash, project.WorkspaceId.ToString("N"));
            AppendField(hash, project.ProjectId.ToString("N"));
            AppendField(hash, canonicalAssetKey);
            AppendField(hash, policyRuleId.Trim().ToLowerInvariant());
            AppendField(hash, FindingCorrelationToken.Normalize(category));
            AppendField(hash, FindingCorrelationToken.Normalize(text));

            return "fnd:v2:" + Convert.ToHexStringLower(hash.GetHashAndReset());
        }
        catch (EncoderFallbackException)
        {
            // Do not let replacement characters silently alias malformed identifiers or text.
            return null;
        }
    }

    private static void AppendField(IncrementalHash hash, string value)
    {
        byte[] bytes = StrictUtf8.GetBytes(value);
        Span<byte> length = stackalloc byte[sizeof(int)];
        BinaryPrimitives.WriteInt32BigEndian(length, bytes.Length);
        hash.AppendData(length);
        hash.AppendData(bytes);
    }
}
