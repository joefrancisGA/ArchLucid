using ArchiForge.Contracts.Governance.Preview;

namespace ArchiForge.Application.Governance.Preview;

public interface IGovernancePreviewService
{
    Task<GovernancePreviewResult> PreviewActivationAsync(
        GovernancePreviewRequest request,
        CancellationToken cancellationToken = default);

    Task<GovernanceEnvironmentComparisonResult> CompareEnvironmentsAsync(
        GovernanceEnvironmentComparisonRequest request,
        CancellationToken cancellationToken = default);
}
