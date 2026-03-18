namespace ArchiForge.Decisioning.Findings.Payloads;

public class SecurityControlFindingPayload
{
    public string ControlId { get; set; } = default!;
    public string ControlName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string Impact { get; set; } = default!;
}

