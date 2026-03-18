namespace ArchiForge.Decisioning.Models;

public class SecuritySection
{
    public List<SecurityPostureItem> Controls { get; set; } = new();
    public List<string> Gaps { get; set; } = new();
}

