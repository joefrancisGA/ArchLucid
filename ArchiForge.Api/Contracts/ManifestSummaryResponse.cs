namespace ArchiForge.Api.HttpContracts;

public class ManifestSummaryResponse
{
    public Guid ManifestId { get; set; }
    public Guid RunId { get; set; }
    public DateTime CreatedUtc { get; set; }
    public string ManifestHash { get; set; } = default!;
    public string RuleSetId { get; set; } = default!;
    public string RuleSetVersion { get; set; } = default!;
    public int DecisionCount { get; set; }
    public int WarningCount { get; set; }
    public int UnresolvedIssueCount { get; set; }
    public string Status { get; set; } = default!;
}
