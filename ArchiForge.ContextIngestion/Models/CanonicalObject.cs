namespace ArchiForge.ContextIngestion.Models;

public class CanonicalObject
{
    public string ObjectId { get; set; } = Guid.NewGuid().ToString("N");

    public string ObjectType { get; set; } = default!;

    public string Name { get; set; } = default!;

    public Dictionary<string, string> Properties { get; set; } = new();
}

