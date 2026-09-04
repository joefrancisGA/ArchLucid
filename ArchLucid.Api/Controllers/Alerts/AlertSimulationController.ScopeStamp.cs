using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertSimulationController
{
    private bool TryResolveRuleKind(string? ruleKind, out bool isSimple, out IActionResult? error)
    {
        isSimple = false;
        error = null;

        if (string.IsNullOrWhiteSpace(ruleKind))
        {
            error = this.BadRequestProblem("RuleKind is required (Simple or Composite).", ProblemTypes.ValidationFailed);
            return false;
        }

        if (ruleKind.Equals("Simple", StringComparison.OrdinalIgnoreCase))
        {
            isSimple = true;
            return true;
        }

        if (ruleKind.Equals("Composite", StringComparison.OrdinalIgnoreCase))
            return true;

        error = this.BadRequestProblem(
            "RuleKind must be Simple or Composite.",
            ProblemTypes.ValidationFailed);
        return false;
    }

    private static void StampSimulationScope(ScopeContext scope, RuleSimulationRequest request)
    {
        if (request.SimpleRule is not null)
        {
            request.SimpleRule.TenantId = scope.TenantId;
            request.SimpleRule.WorkspaceId = scope.WorkspaceId;
            request.SimpleRule.ProjectId = scope.ProjectId;
        }

        if (request.CompositeRule is null)
            return;

        request.CompositeRule.TenantId = scope.TenantId;
        request.CompositeRule.WorkspaceId = scope.WorkspaceId;
        request.CompositeRule.ProjectId = scope.ProjectId;
    }

    private static void StampComparisonScope(ScopeContext scope, RuleCandidateComparisonRequest request)
    {
        StampSimple(request.CandidateASimpleRule);
        StampSimple(request.CandidateBSimpleRule);
        StampComposite(request.CandidateACompositeRule);
        StampComposite(request.CandidateBCompositeRule);
        return;

        void StampSimple(AlertRule? r)
        {
            if (r is null)
                return;
            r.TenantId = scope.TenantId;
            r.WorkspaceId = scope.WorkspaceId;
            r.ProjectId = scope.ProjectId;
        }

        void StampComposite(CompositeAlertRule? r)
        {
            if (r is null)
                return;
            r.TenantId = scope.TenantId;
            r.WorkspaceId = scope.WorkspaceId;
            r.ProjectId = scope.ProjectId;
        }
    }
}
