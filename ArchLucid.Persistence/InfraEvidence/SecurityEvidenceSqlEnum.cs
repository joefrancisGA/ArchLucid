using System.Globalization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>SQL read boundary for explicitly stored, ordinary enum ordinals in security evidence.</summary>
internal static class SecurityEvidenceSqlEnum
{
    internal static TEnum RequireOrdinal<TEnum>(int? ordinal, string column) where TEnum : struct, Enum
    {
        if (ordinal is int present
            && DefinedEnum.TryParse(present.ToString(CultureInfo.InvariantCulture), ignoreCase: false, out TEnum value))
            return value;

        // Missing, NULL and undeclared are all corrupt at this boundary. In particular, an absent SQL
        // projection must never materialize as the affirmative enum value zero.
        throw new InvalidDataException($"The persisted {column} is missing or is not a declared {typeof(TEnum).Name} ordinal.");
    }
}
