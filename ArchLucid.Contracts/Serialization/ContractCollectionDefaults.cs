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

    public static Dictionary<string, string> CoalesceStringDictionaryOrdinal(Dictionary<string, string>? value) =>
        value ?? new Dictionary<string, string>(StringComparer.Ordinal);

    public static string CoalesceRequired(string? value) => value ?? string.Empty;

    /// <summary>Substitutes <c>[]</c> when JSON deserializes explicit <c>null</c> on persisted JSON-array column strings.</summary>
    public static string CoalesceJsonArrayLiteral(string? value) => value ?? "[]";

    /// <summary>Substitutes a legacy default when JSON deserializes explicit <c>null</c> on required string columns.</summary>
    public static string CoalesceStringDefault(string? value, string legacyDefaultWhenNull) =>
        value ?? legacyDefaultWhenNull;

    /// <summary>Rejects explicitly invalid enum values rather than converting them into a successful state.</summary>
    public static TEnum RequireDefinedEnum<TEnum>(TEnum value) where TEnum : struct, Enum =>
        Enum.IsDefined(value) ? value : throw new System.Text.Json.JsonException($"Undefined {typeof(TEnum).Name} value.");
}
