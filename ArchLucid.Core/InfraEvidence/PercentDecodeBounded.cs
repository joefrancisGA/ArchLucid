namespace ArchLucid.Core.InfraEvidence;

/// <summary>Percent-decodes values that may have been encoded multiple times.</summary>
public static class PercentDecodeBounded
{
    /// <summary>
    ///     Repeatedly applies <see cref="Uri.UnescapeDataString" /> up to <paramref name="maxPasses" /> times,
    ///     stopping when a pass no longer changes the value. <see cref="Uri.UnescapeDataString" /> may throw on
    ///     malformed percent-encoding; if it does, decoding stops and the last successfully decoded value is kept.
    ///     <paramref name="maxPasses" /> must be at least 1.
    /// </summary>
    public static string Decode(string input, int maxPasses = 8)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentOutOfRangeException.ThrowIfLessThan(maxPasses, 1);

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
