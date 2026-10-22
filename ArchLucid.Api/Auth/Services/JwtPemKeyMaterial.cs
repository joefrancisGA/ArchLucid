using System.Security.Cryptography;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Loads RSA keys from a filesystem path or inline PEM text (Container App secretref).</summary>
internal static class JwtPemKeyMaterial
{
    internal static RsaSecurityKey LoadPublicKey(string? pemPath, string? pemInline)
    {
        string pem = ResolvePemText(pemPath, pemInline, "public");

        using RSA rsa = RSA.Create();

        rsa.ImportFromPem(pem);

        return new RsaSecurityKey(rsa.ExportParameters(false));
    }

    internal static RsaSecurityKey LoadPrivateKey(string? pemPath, string? pemInline)
    {
        string pem = ResolvePemText(pemPath, pemInline, "private");

        using RSA rsa = RSA.Create();

        rsa.ImportFromPem(pem);

        return new RsaSecurityKey(rsa.ExportParameters(true));
    }

    internal static bool HasAnyPemSource(string? pemPath, string? pemInline) =>
        !string.IsNullOrWhiteSpace(pemPath) || !string.IsNullOrWhiteSpace(pemInline);

    private static string ResolvePemText(string? pemPath, string? pemInline, string label)
    {
        string inline = pemInline?.Trim() ?? string.Empty;

        if (inline.Length > 0)
        {
            return inline;
        }

        string path = pemPath?.Trim() ?? string.Empty;

        if (path.Length == 0)
        {
            throw new InvalidOperationException($"JWT {label} key PEM is not configured (path or inline).");
        }

        string resolvedPath = Path.IsPathRooted(path)
            ? path
            : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), path));

        if (!File.Exists(resolvedPath))
        {
            throw new InvalidOperationException($"JWT {label} key PEM file is missing: '{resolvedPath}'.");
        }

        return File.ReadAllText(resolvedPath);
    }
}
