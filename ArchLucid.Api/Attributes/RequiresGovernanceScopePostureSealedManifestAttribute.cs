namespace ArchLucid.Api.Attributes;

/// <summary>
///     Opt-in marker: this HTTP action requires the latest committed project run to pass sealed-manifest verification
///     before executing. Endpoints without this attribute must not call scope-posture sealed-manifest guards at the API layer.
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public sealed class RequiresGovernanceScopePostureSealedManifestAttribute : Attribute
{
    public RequiresGovernanceScopePostureSealedManifestAttribute(string rationale)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rationale);
        Rationale = rationale;
    }

    public string Rationale { get; }
}
