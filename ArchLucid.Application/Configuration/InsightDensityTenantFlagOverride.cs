namespace ArchLucid.Application.Configuration;

/// <summary>
///     One tenant's stored value for a single insight-density flag.
/// </summary>
/// <remarks>
///     An absent override (<see cref="IsOverridden" /> false) means "inherit the execution-mode default". That is
///     not the same as a stored <c>false</c>: Real mode turns these flags on when nothing is stored, so the
///     distinction is what allows a tenant to opt back out.
/// </remarks>
public sealed record InsightDensityTenantFlagOverride(bool IsOverridden, bool Value)
{
    /// <summary>No tenant value stored — inherit the execution-mode default.</summary>
    public static InsightDensityTenantFlagOverride Absent { get; } = new(IsOverridden: false, Value: false);
}
