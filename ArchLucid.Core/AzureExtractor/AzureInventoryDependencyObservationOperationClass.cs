namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Allowed <c>operationClass</c> values for <c>dependency-observations.json</c> (SN-RT-06).
/// </summary>
public static class AzureInventoryDependencyObservationOperationClass
{
    public const string Read = "read";

    public const string Write = "write";

    public const string Unknown = "unknown";

    public static bool IsValid(string? operationClass)
    {
        if (string.IsNullOrWhiteSpace(operationClass))
        {
            return false;
        }

        return operationClass.Equals(Read, StringComparison.OrdinalIgnoreCase)
               || operationClass.Equals(Write, StringComparison.OrdinalIgnoreCase)
               || operationClass.Equals(Unknown, StringComparison.OrdinalIgnoreCase);
    }
}
