namespace ArchLucid.Core.InfraEvidence;

/// <summary>Repeatedly percent-decodes ARM scalar values with a bounded pass limit.</summary>
public static class ArmPercentDecoder
{
    /// <summary>Default bound for nested percent-decode passes on inventory ARM scalars.</summary>
    public const int DefaultMaxPasses = 8;

    /// <summary>
    ///     Repeatedly applies <see cref="Uri.UnescapeDataString" /> until the value stops changing or
    ///     <paramref name="maxPasses" /> is reached, so multi-layer percent-encoded values decode fully
    ///     without an unbounded loop.
    /// </summary>
    public static string PercentDecodeRepeatedly(string input, int maxPasses = DefaultMaxPasses)
    {
        string working = input;

        for (int pass = 0; pass < maxPasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;
        }

        return working;
    }
}
