namespace ArchLucid.Core.Pagination;

/// <summary>Shared Base64-url helpers for opaque pagination cursors.</summary>
public static class Base64UrlCodec
{
    public static string Encode(byte[] utf8Bytes)
    {
        string b64 = Convert.ToBase64String(utf8Bytes);

        return b64.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryDecode(string? encoded, out byte[] bytes)
    {
        bytes = Array.Empty<byte>();

        if (string.IsNullOrWhiteSpace(encoded))
            return false;

        try
        {
            string padded = encoded.Trim().Replace('-', '+').Replace('_', '/');
            switch (padded.Length % 4)
            {
                case 2:
                    padded += "==";
                    break;
                case 3:
                    padded += "=";
                    break;
            }

            bytes = Convert.FromBase64String(padded);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
