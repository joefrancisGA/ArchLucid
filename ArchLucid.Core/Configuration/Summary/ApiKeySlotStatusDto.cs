namespace ArchLucid.Core.Configuration.Summary;

public sealed class ApiKeySlotStatusDto
{
    public bool IsConfigured { get; set; }

    public IReadOnlyList<string>? MaskedSegments { get; set; }

    public DateTimeOffset? ExpiresAtUtc { get; set; }
}
