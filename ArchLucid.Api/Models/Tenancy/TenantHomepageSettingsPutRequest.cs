namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>PUT /v1/tenant/homepage-settings</c>.</summary>
public sealed class TenantHomepageSettingsPutRequest
{
    /// <summary>
    ///     Featured completed sample run id, or <see langword="null" /> to clear the selection.
    ///     Omitted JSON properties are rejected so accidental <c>{}</c> bodies cannot clear selection.
    /// </summary>
    public required Guid? SelectedRunId
    {
        get;
        init;
    }
}
