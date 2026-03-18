namespace ArchiForge.Decisioning.Models;

public class ConstraintSection
{
    public List<string> MandatoryConstraints { get; set; } = new();
    public List<string> Preferences { get; set; } = new();
}

