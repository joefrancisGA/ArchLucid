namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabResource(
    string Id,
    string Name,
    string Type,
    string ResourceType,
    string Location,
    string ResourceGroup,
    bool? IsUnknownType = null);
