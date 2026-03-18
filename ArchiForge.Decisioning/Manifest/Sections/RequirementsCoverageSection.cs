namespace ArchiForge.Decisioning.Models;

public class RequirementsCoverageSection
{
    public List<RequirementCoverageItem> Covered { get; set; } = new();
    public List<RequirementCoverageItem> Uncovered { get; set; } = new();
}

