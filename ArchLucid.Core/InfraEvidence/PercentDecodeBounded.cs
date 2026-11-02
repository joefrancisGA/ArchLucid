namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Repeatedly percent-decodes a value (companion ARM ids are sometimes double-encoded) with a
///     bounded pass count so adversarial inputs cannot force unbounded decoding work.
/// </summary>
internal static class PercentDecodeBounded
{
    public const int MaxPasses = 8;

    public static string Decode(string value)
    {
        string working = value;

        for (int pass = 0; pass < MaxPasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded;

            try
            {
                decoded = Uri.UnescapeDataString(working);
            }
            catch (UriFormatException)
            {
                return working;
            }
            catch (ArgumentException)
            {
                return working;
            }

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;
        }

        return working;
    }
}
