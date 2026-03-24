namespace ArchiForge.Contracts.Governance.Preview;

public sealed class GovernanceDiffItem
{
    public string Key { get; set; } = string.Empty;
    public string ChangeType { get; set; } = string.Empty;
    public string? CurrentValue { get; set; }
    public string? PreviewValue { get; set; }
}
