namespace ArchLucid.Contracts.Serialization;

/// <summary>
///     Normalizes explicit JSON <c>null</c> collection tokens so property initializers are not bypassed on deserialize.
/// </summary>
public static class ContractCollectionDefaults
{
    public static List<T> Coalesce<T>(List<T>? value) => value ?? [];

    public static IReadOnlyList<T> CoalesceReadOnly<T>(IReadOnlyList<T>? value) => value ?? [];

    public static Dictionary<TKey, TValue> CoalesceDictionary<TKey, TValue>(Dictionary<TKey, TValue>? value)
        where TKey : notnull => value ?? [];
}
