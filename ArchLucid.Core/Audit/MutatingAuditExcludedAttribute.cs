namespace ArchLucid.Core.Audit;

/// <summary>
///     Suppresses <c>AL0003</c> when a POST/PUT/DELETE action deliberately does not call
///     <see cref="IAuditService.LogAsync"/> in-controller (delegated auditing, webhook signature paths, telemetry-only
///     endpoints). Prefer tightening coverage over widening exemptions.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
public sealed class MutatingAuditExcludedAttribute(string? reason = null) : Attribute
{
    public string Reason { get; } = reason ?? string.Empty;
}
