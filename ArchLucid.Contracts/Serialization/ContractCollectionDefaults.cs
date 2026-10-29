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

    /// <summary>Maps explicit JSON numeric <c>0</c> (invalid for this enum) to <see cref="Findings.FindingsSnapshotGenerationStatus.Complete" />.</summary>
    public static Findings.FindingsSnapshotGenerationStatus CoalesceFindingsSnapshotGenerationStatus(
        Findings.FindingsSnapshotGenerationStatus value) =>
        value == default ? Findings.FindingsSnapshotGenerationStatus.Complete : value;
}
