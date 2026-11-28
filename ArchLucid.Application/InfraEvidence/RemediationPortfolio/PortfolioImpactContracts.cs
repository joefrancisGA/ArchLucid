namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public enum PortfolioControlState { Unknown, Enforced, NotEnforced }

public sealed record PortfolioModeledControl(string ControlId, PortfolioControlState State);
public sealed record PortfolioExposureCondition(string ControlId, PortfolioControlState RequiredState);

/// <summary>Reviewed, opaque observation template, not a route to discover or execute.</summary>
public sealed record PortfolioExposureObservation(string ObservationId, string EvidenceSha256,
    IReadOnlyList<PortfolioExposureCondition> AllConditions);

public sealed record PortfolioExposureScenario(string ScenarioId, bool CoverageComplete,
    IReadOnlyList<PortfolioExposureObservation> Observations);

public sealed record PortfolioImpactCapture(PortfolioOptimizationPin Portfolio, string ObservationModelVersion, bool CoverageComplete,
    IReadOnlyList<PortfolioModeledControl> Controls, IReadOnlyList<PortfolioExposureScenario> Scenarios);

public sealed record PortfolioControlChange(string ControlId, PortfolioControlState ExpectedState, PortfolioControlState ProposedState);

/// <summary>Declarative in-memory effect only. No cloud resource, command, code or runtime handler.</summary>
public sealed record PortfolioModeledEffect(string ActionId, string EvidenceSha256, IReadOnlyList<PortfolioControlChange> Changes);

public sealed record PortfolioImpactPlan(PortfolioOptimizationPin Portfolio, string? OptimizerInputSha256,
    IReadOnlyList<string> SelectedActionIds, IReadOnlyList<PortfolioModeledEffect> Effects)
{
    /// <summary>Captures an advisory selection. The plan still needs an independently supplied reviewed digest.</summary>
    public static PortfolioImpactPlan FromAdvisoryPlan(PortfolioOptimizationPin portfolio, PortfolioOptimizationResult result,
        IReadOnlyList<PortfolioModeledEffect> effects)
    {
        ArgumentNullException.ThrowIfNull(result);
        if (result.BestFeasiblePlan is not { } best || result.InputSha256 is null
            || result.Status is not (PortfolioOptimizationStatus.Optimal or PortfolioOptimizationStatus.WorkLimit
                or PortfolioOptimizationStatus.TimeLimit))
            throw new ArgumentException("An available advisory plan is required.", nameof(result));
        return new(portfolio, result.InputSha256, best.SelectedActionIds, effects);
    }
}

/// <summary>Obtained from an authorized source independent of the untrusted inputs to the verifier.</summary>
public sealed record PortfolioImpactPin(PortfolioOptimizationPin Portfolio, string CaptureSha256, string PlanSha256);

public sealed record PortfolioImpactLimits(int MaxWork, TimeSpan Timeout);

public enum PortfolioImpactStatus
{
    Modeled, IncompleteCoverage, InvalidInput, StaleInput, UnsupportedEffect, InfeasiblePlan, VerificationMismatch,
    WorkLimit, TimeLimit, Cancelled,
}

public enum PortfolioExposureState { Unknown, Present, AbsentWithinCoverage }
public enum PortfolioExposureDelta { Unknown, Removed, Remaining, Introduced, AbsentInBothWithinCoverage }

public sealed record PortfolioObservationImpact(string ObservationId, string EvidenceSha256,
    PortfolioExposureState Baseline, PortfolioExposureState Proposed, PortfolioExposureDelta Delta);

public sealed record PortfolioScenarioImpact(string ScenarioId, PortfolioExposureState Baseline,
    PortfolioExposureState Proposed, PortfolioExposureDelta Delta, IReadOnlyList<PortfolioObservationImpact> Observations);

public sealed record PortfolioImpactResult(string Version, PortfolioImpactStatus Status, string? BaselineSha256,
    string? ProposedSha256, string? PlanSha256, bool FullComparisonPassed, IReadOnlyList<PortfolioScenarioImpact> Scenarios,
    IReadOnlyList<PortfolioIssue> Issues, int Work)
{
    public bool IsModeledOnly => true;
}
