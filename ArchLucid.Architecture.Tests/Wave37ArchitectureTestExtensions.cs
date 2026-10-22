namespace ArchLucid.Architecture.Tests;

internal static class Wave37ArchitectureTestExtensions
{
    public static int CountOccurrences(this string source, string value)
    {
        if (source is null)
        {
            throw new ArgumentNullException(nameof(source));
        }

        if (value is null)
        {
            throw new ArgumentNullException(nameof(value));
        }

        int count = 0;
        int index = 0;

        while ((index = source.IndexOf(value, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += value.Length;
        }

        return count;
    }
}
