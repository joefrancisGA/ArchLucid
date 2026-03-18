namespace ArchiForge.Decisioning.Findings.Payloads;

public class RequirementFindingPayload
{
    public string RequirementText { get; set; } = default!;
    public string RequirementName { get; set; } = default!;
    public bool IsMandatory { get; set; }
}

