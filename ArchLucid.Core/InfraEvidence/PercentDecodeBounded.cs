namespace ArchLucid.Core.InfraEvidence;

/// <summary>Percent-decodes values that may have been encoded multiple times.</summary>
public static class PercentDecodeBounded
{
    /// <summary>
    ///     Repeatedly applies <see cref="Uri.UnescapeDataString" /> up to <paramref name="maxPasses" /> times,
    ///     stopping when a pass no longer changes the value. On malformed percent-encoding the decode throws, in
    ///     which case the last successfully decoded value is kept.
    /// </summary>
    public static string Decode(string input, int maxPasses = 8)
    {
        ArgumentNullException.ThrowIfNull(input);

        string working = input;

        for (int pass = 0; pass < maxPasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded;

            try
            {
                decoded = Uri.UnescapeDataString(working);
            }
            catch (UriFormatException)
            {
                break;
            }
            catch (ArgumentException)
            {
                break;
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
