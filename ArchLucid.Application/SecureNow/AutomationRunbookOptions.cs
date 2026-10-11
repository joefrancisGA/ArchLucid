namespace ArchLucid.Application.SecureNow;

public sealed class AutomationRunbookOptions
{
    public const string SectionName = "SecureNow:Automation";

    public bool Enabled { get; set; }
    public string SubscriptionId { get; set; } = string.Empty;
    public string ResourceGroupName { get; set; } = string.Empty;
    public string AutomationAccountName { get; set; } = string.Empty;
    public string RunbookName { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "2023-11-01";
}
