namespace ArchLucid.Host.Core.Configuration;

public sealed class ArchLucidOptions
{
    public const string SectionName = "ArchiForge";

    /// <summary>InMemory (tests/local) or Sql (durable).</summary>
    public string StorageProvider { get; set; } = "Sql";
}
