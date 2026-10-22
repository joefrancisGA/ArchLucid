using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.User;

/// <summary>Personal cloud-platform visibility saved on the user preferences surface.</summary>
public sealed class CloudPlatformScopeDto
{
    [JsonPropertyName("evidence-only")]
    public bool EvidenceOnly
    {
        get;
        set;
    } = true;

    public bool Azure
    {
        get;
        set;
    } = true;

    public bool Aws
    {
        get;
        set;
    } = true;

    public bool Gcp
    {
        get;
        set;
    } = true;
}
