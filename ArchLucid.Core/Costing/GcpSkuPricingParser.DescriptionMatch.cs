namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    private static bool DescriptionMatchesMachineType(string description, string machineType)
    {
        int index = description.IndexOf(machineType, StringComparison.OrdinalIgnoreCase);

        if (index < 0)
            return false;

        int endIndex = index + machineType.Length;

        if (index > 0)
        {
            char previous = description[index - 1];

            if (previous is >= '0' and <= '9' or '-')
                return false;

            // Reject letter-variant prefixes such as e2-micro matching ve2-micro.
            if (char.IsLetter(previous))
                return false;
        }

        if (endIndex >= description.Length)
            return true;

        char next = description[endIndex];

        // Reject prefix collisions such as n1-standard-1 matching n1-standard-10.
        if (next is >= '0' and <= '9' or '-')
            return false;

        // Reject letter-variant suffixes such as n1-standard-1 matching n1-standard-1d.
        if (char.IsDigit(description[endIndex - 1]) && char.IsLetter(next))
            return false;

        return true;
    }
}
