namespace ArchLucid.Architecture.Tests;

/// <summary>
/// Allowlisted <c>ArchLucid.Decisioning</c> compatibility stubs (Improvement #21 / Batch G).
/// New stubs require an entry here, a canonical Core port, and Architecture.Tests coverage.
/// </summary>
internal static class ArchitectureConstraintCompatibilityStubCatalog
{
    private const string DefaultRemovalCriteria =
        "Delete when no production or test code imports the Decisioning namespace alias; "
        + "callers must use the canonical Core port directly.";

    private const string LegacyBridgeRemovalCriteria =
        "Delete after Decisioning-specific context/model types are removed and callers use Core contracts only.";

    internal static readonly ArchitectureConstraintCompatibilityStubEntry[] DecisioningStubs =
    [
        Entry("ArchLucid.Decisioning/Alerts/IAlertService.cs", "IAlertService", "ArchLucid.Core.Alerts.IAlertService"),
        Entry(
            "ArchLucid.Decisioning/Alerts/IAlertEvaluator.cs",
            "IAlertEvaluator",
            "ArchLucid.Core.Alerts.IAlertEvaluator",
            LegacyBridgeRemovalCriteria,
            allowsLegacyTypeBridge: true),
        Entry(
            "ArchLucid.Decisioning/Alerts/Composite/ICompositeAlertService.cs",
            "ICompositeAlertService",
            "ArchLucid.Core.Alerts.Composite.ICompositeAlertService"),
        Entry(
            "ArchLucid.Decisioning/Alerts/Composite/ICompositeAlertRuleEvaluator.cs",
            "ICompositeAlertRuleEvaluator",
            "ArchLucid.Core.Alerts.Composite.ICompositeAlertRuleEvaluator"),
        Entry(
            "ArchLucid.Decisioning/Alerts/Composite/IAlertMetricSnapshotBuilder.cs",
            "IAlertMetricSnapshotBuilder",
            "ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder",
            LegacyBridgeRemovalCriteria,
            allowsLegacyTypeBridge: true),
        Entry(
            "ArchLucid.Decisioning/Alerts/Composite/IAlertSuppressionPolicy.cs",
            "IAlertSuppressionPolicy",
            "ArchLucid.Core.Alerts.Composite.IAlertSuppressionPolicy"),
        Entry(
            "ArchLucid.Decisioning/Alerts/Simulation/IAlertSimulationContextProvider.cs",
            "IAlertSimulationContextProvider",
            "ArchLucid.Core.Alerts.Simulation.IAlertSimulationContextProvider"),
        Entry(
            "ArchLucid.Decisioning/Alerts/Simulation/IRuleSimulationService.cs",
            "IRuleSimulationService",
            "ArchLucid.Core.Alerts.Simulation.IRuleSimulationService"),
        Entry(
            "ArchLucid.Decisioning/Alerts/Tuning/IThresholdRecommendationService.cs",
            "IThresholdRecommendationService",
            "ArchLucid.Core.Alerts.Tuning.IThresholdRecommendationService"),
        Entry(
            "ArchLucid.Decisioning/Advisory/Scheduling/IAdvisoryScanRunner.cs",
            "IAdvisoryScanRunner",
            "ArchLucid.Core.Advisory.Scheduling.IAdvisoryScanRunner"),
        Entry(
            "ArchLucid.Decisioning/Advisory/Workflow/IRecommendationWorkflowService.cs",
            "IRecommendationWorkflowService",
            "ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService"),
        Entry(
            "ArchLucid.Decisioning/Advisory/Workflow/IRecommendationFeedbackAnalyzer.cs",
            "IRecommendationFeedbackAnalyzer",
            "ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer"),
        Entry(
            "ArchLucid.Decisioning/Compliance/Loaders/IComplianceRulePackLoader.cs",
            "IComplianceRulePackLoader",
            "ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader",
            LegacyBridgeRemovalCriteria,
            allowsLegacyTypeBridge: true),
        Entry(
            "ArchLucid.Decisioning/Compliance/Loaders/IComplianceRulePackProvider.cs",
            "IComplianceRulePackProvider",
            "ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider",
            LegacyBridgeRemovalCriteria,
            allowsLegacyTypeBridge: true),
        Entry(
            "ArchLucid.Decisioning/Governance/PolicyPacks/IEffectiveGovernanceLoader.cs",
            "IEffectiveGovernanceLoader",
            "ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader"),
        Entry(
            "ArchLucid.Decisioning/Governance/PolicyPacks/IPolicyPackResolver.cs",
            "IPolicyPackResolver",
            "ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver"),
        Entry(
            "ArchLucid.Decisioning/Governance/Resolution/IEffectiveGovernanceResolver.cs",
            "IEffectiveGovernanceResolver",
            "ArchLucid.Core.Governance.Resolution.IEffectiveGovernanceResolver"),
        Entry(
            "ArchLucid.Decisioning/Interfaces/IDecisionEngine.cs",
            "IDecisionEngine",
            "ArchLucid.Core.Persistence.Ports.IDecisionEngine"),
        Entry(
            "ArchLucid.Decisioning/Interfaces/IFindingsOrchestrator.cs",
            "IFindingsOrchestrator",
            "ArchLucid.Core.Persistence.Ports.IFindingsOrchestrator"),
    ];

    private static ArchitectureConstraintCompatibilityStubEntry Entry(
        string relativeSourcePath,
        string stubInterfaceName,
        string canonicalTypeFullName,
        string? removalCriteria = null,
        bool allowsLegacyTypeBridge = false)
    {
        return new ArchitectureConstraintCompatibilityStubEntry(
            relativeSourcePath,
            stubInterfaceName,
            canonicalTypeFullName,
            removalCriteria ?? DefaultRemovalCriteria,
            allowsLegacyTypeBridge);
    }
}
