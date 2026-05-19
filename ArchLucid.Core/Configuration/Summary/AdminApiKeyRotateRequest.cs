namespace ArchLucid.Core.Configuration.Summary;

public sealed class AdminApiKeyRotateRequest
{
    /// <summary><c>Admin</c> or <c>ReadOnly</c>.</summary>
    public string Slot { get; set; } = "Admin";

    /// <summary>When false, append the new key for zero-downtime overlap; when true, replace with the new key only.</summary>
    public bool InvalidatePrevious { get; set; } = true;
}
