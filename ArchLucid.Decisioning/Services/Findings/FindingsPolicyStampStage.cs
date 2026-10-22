using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed partial class FindingsPolicyStampStage(
    IScopeContextProvider? scopeContextProvider = null,
    IEffectiveGovernanceLoader? effectiveGovernanceLoader = null,
    ILogger<FindingsPolicyStampStage>? logger = null) : IFindingsPolicyStampStage
{
    private readonly IScopeContextProvider? _scopeContextProvider = scopeContextProvider;

    private readonly IEffectiveGovernanceLoader? _effectiveGovernanceLoader = effectiveGovernanceLoader;

    private readonly ILogger<FindingsPolicyStampStage> _logger =
        logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<FindingsPolicyStampStage>.Instance;

    public async Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (_scopeContextProvider is null || _effectiveGovernanceLoader is null)
            return;

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            PolicyPackContentDocument effective = await _effectiveGovernanceLoader
                .LoadEffectiveContentAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

            PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(effective);

            if (!facet.IsEmpty)
                PolicyExpectationGraphStamp.Stamp(context.GraphSnapshot, facet);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            LogPolicyExpectationStampFailed(ex, context.RunId);
        }
    }

    [LoggerMessage(
        EventId = 6,
        Level = LogLevel.Warning,
        Message = "Policy expectation stamp failed (fail-open): RunId={RunId}")]
    private partial void LogPolicyExpectationStampFailed(Exception ex, Guid runId);
}
