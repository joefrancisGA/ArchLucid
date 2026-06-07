namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Marks a repository type or method whose Dapper SQL is intentionally not scope-bound at the statement level.
///     Consumed by <c>ARCH006</c> <c>TenantScopedQueryScopeBindingAnalyzer</c>.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class TenantScopeExemptAttribute : Attribute
{
    public TenantScopeExemptAttribute(TenantScopeExemptReason reason, string justification)
    {
        if (string.IsNullOrWhiteSpace(justification))
            throw new ArgumentException("Justification is required.", nameof(justification));

        Reason = reason;
        Justification = justification;
    }

    public TenantScopeExemptReason Reason { get; }

    public string Justification { get; }
}
