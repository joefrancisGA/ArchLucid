namespace ArchiForge.Api.Controllers;

public sealed class CreatePolicyPackRequest
{
    public string Name { get; set; } = default!;
    public string Description { get; set; } = "";
    public string PackType { get; set; } = default!;
    public string InitialContentJson { get; set; } = "{}";
}

public sealed class PublishPolicyPackVersionRequest
{
    public string Version { get; set; } = default!;
    public string ContentJson { get; set; } = "{}";
}

public sealed class AssignPolicyPackRequest
{
    public string Version { get; set; } = default!;
}
