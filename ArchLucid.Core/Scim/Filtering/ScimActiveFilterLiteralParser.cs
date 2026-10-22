namespace ArchLucid.Core.Scim.Filtering;

/// <summary>Parses SCIM filter literals for the <c>active</c> attribute (RFC 7643 boolean; provisioners sometimes send 0/1).</summary>
public static class ScimActiveFilterLiteralParser
{
    public static bool TryParseEqualityOperand(string value, out bool active)
    {
        ArgumentNullException.ThrowIfNull(value);

        if (bool.TryParse(value, out bool parsed))
        {
            active = parsed;

            return true;
        }

        if (string.Equals(value, "1", StringComparison.Ordinal))
        {
            active = true;

            return true;
        }

        if (string.Equals(value, "0", StringComparison.Ordinal))
        {
            active = false;

            return true;
        }

        active = false;

        return false;
    }
}
