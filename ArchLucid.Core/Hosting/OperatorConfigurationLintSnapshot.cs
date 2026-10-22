namespace ArchLucid.Core.Hosting;

/// <summary>
///     Blocking vs advisory configuration lint findings for operators (CLI <c>config lint</c> parity and HTTP surface).
/// </summary>
/// <remarks>
///     Blocking merges auth traps used by <c>archlucid config lint</c> with
///     <see cref="ProductionDangerousMisconfigurationLint.DescribeFailFastFindings" />. Advisory merges
///     <see cref="ProductionLikeHostingMisconfigurationAdvisor.DescribeWarningRecords" /> with optional Azure OpenAI
///     TCP reachability hints (<see cref="AzureOpenAiEndpointConnectivityLintAdvisor" />).
/// </remarks>
public sealed record OperatorConfigurationLintSnapshot(
    string HostingEnvironmentName,
    IReadOnlyList<HostingMisconfigurationWarning> BlockingFindings,
    IReadOnlyList<HostingMisconfigurationWarning> AdvisoryFindings)
{
    /// <summary>True when there are zero blocking findings.</summary>
    public bool Ok => BlockingFindings.Count == 0;
}
