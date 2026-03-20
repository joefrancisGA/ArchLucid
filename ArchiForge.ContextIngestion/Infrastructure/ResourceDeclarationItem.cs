namespace ArchiForge.ContextIngestion.Infrastructure;

public class ResourceDeclarationItem
{
    public string Type { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Subtype { get; set; }
    public string? Region { get; set; }
    public Dictionary<string, string> Properties { get; set; } = new();
}
