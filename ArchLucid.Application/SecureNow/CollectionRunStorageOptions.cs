namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunStorageOptions
{
    public const string SectionName = "SecureNow:CollectionStorage";

    public string ContainerName { get; set; } = "securenow-collection";
    public string Prefix { get; set; } = "runs/";
}
