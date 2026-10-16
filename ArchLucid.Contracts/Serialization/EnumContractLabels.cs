using System.Text.RegularExpressions;

namespace ArchLucid.Contracts.Serialization;

internal static partial class EnumContractLabels
{
    public static string For<TEnum>() where TEnum : struct, Enum => For(typeof(TEnum));

    public static string For(Type enumType)
    {
        string spaced = PascalCaseSpacingRegex().Replace(enumType.Name, " $0").Trim();
        return spaced.ToLowerInvariant();
    }

    [GeneratedRegex(@"(?<=[a-z])([A-Z])|(?<=[A-Z])([A-Z][a-z])")]
    private static partial Regex PascalCaseSpacingRegex();
}
