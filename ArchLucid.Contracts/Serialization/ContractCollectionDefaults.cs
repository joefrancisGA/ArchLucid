namespace ArchLucid.Contracts.Serialization;

/// <summary>
///     Normalizes explicit JSON <c>null</c> collection tokens so property initializers are not bypassed on deserialize.
/// </summary>
public static class ContractCollectionDefaults
{
    public static List<T> Coalesce<T>(List<T>? value) => value ?? [];

    public static T[] CoalesceArray<T>(T[]? value) => value ?? [];

    public static IReadOnlyList<T> CoalesceReadOnly<T>(IReadOnlyList<T>? value) => value ?? [];

    public static Dictionary<TKey, TValue> CoalesceDictionary<TKey, TValue>(Dictionary<TKey, TValue>? value)
        where TKey : notnull => value ?? [];

    public static Dictionary<string, string> CoalesceStringDictionaryOrdinalIgnoreCase(Dictionary<string, string>? value) =>
        value ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public static string CoalesceRequired(string? value) => value ?? string.Empty;

    /// <summary>Substitutes <c>[]</c> when JSON deserializes explicit <c>null</c> on persisted JSON-array column strings.</summary>
    public static string CoalesceJsonArrayLiteral(string? value) => value ?? "[]";

    /// <summary>Substitutes a legacy default when JSON deserializes explicit <c>null</c> on required string columns.</summary>
    public static string CoalesceStringDefault(string? value, string legacyDefaultWhenNull) =>
        value ?? legacyDefaultWhenNull;

    /// <summary>
    ///     Substitutes <paramref name="legacyDefaultWhenInvalidZero" /> when JSON numeric <c>0</c> deserializes to
    ///     <see langword="default" /> for enums with no zero member (property initializers do not apply on deserialize).
    /// </summary>
    public static TEnum CoalesceInvalidEnumZero<TEnum>(TEnum value, TEnum legacyDefaultWhenInvalidZero)
        where TEnum : struct, Enum =>
        EqualityComparer<TEnum>.Default.Equals(value, default) ? legacyDefaultWhenInvalidZero : value;
}
