using System.Globalization;

namespace ArchLucid.Core.Json;

/// <summary>Normalizes legacy whole-number JSON text without rounding identifier values.</summary>
internal static class JsonInt64TokenReader
{
    internal static bool TryParse(string? raw, out long value)
    {
        ReadOnlySpan<char> token = raw.AsSpan().Trim();

        if (long.TryParse(token, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        // Legacy floating-point spellings were accepted only for nonnegative integers.
        if (decimal.TryParse(token, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal numeric)
            && numeric >= 0m
            && numeric <= long.MaxValue
            && numeric == decimal.Truncate(numeric)
            && HasNoNonzeroFraction(token))
        {
            value = (long)numeric;
            return true;
        }

        value = default;
        return false;
    }

    private static bool HasNoNonzeroFraction(ReadOnlySpan<char> token)
    {
        int exponentStart = token.IndexOfAny('e', 'E');
        ReadOnlySpan<char> significand = exponentStart < 0 ? token : token[..exponentStart];
        int exponent = 0;
        if (exponentStart >= 0 && !int.TryParse(token[(exponentStart + 1)..],
                NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out exponent))
        {
            return false;
        }

        int decimalPoint = significand.IndexOf('.');
        int fractionalDigits = decimalPoint < 0 ? 0 : significand.Length - decimalPoint - 1;
        long remaining = (long)fractionalDigits - exponent;

        // Decimal.TryParse can round away a very small nonzero fraction. Check the original digits.
        for (int index = significand.Length - 1; index >= 0 && remaining > 0; index--)
        {
            char character = significand[index];
            if (character is '.' or '+' or '-')
                continue;

            if (character != '0')
                return false;

            remaining--;
        }

        return true;
    }
}
