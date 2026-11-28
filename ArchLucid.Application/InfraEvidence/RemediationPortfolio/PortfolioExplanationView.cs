using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Standalone, inert proposed-plan view for an already authorized report. Renders no execution controls.</summary>
public static class PortfolioExplanationView
{
    public static string RenderHtml(PortfolioExplanation.Result report)
    {
        ArgumentNullException.ThrowIfNull(report);
        var html = new StringBuilder();
        html.Append("""
            <!doctype html><html lang="en"><head><meta charset="utf-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Advisory remediation portfolio</title></head><body><main>
            <h1>Advisory remediation portfolio</h1>
            <p>For review only. Modeled points are not probabilities, financial savings or proof of remediation.
            Independent proposed-state verification is not part of this report. Existing human approval is still required.</p>
            """);
        Text(html, "Report status", report.Status);
        Text(html, "Detail", report.Detail);

        if (report.Frontier is { } frontier)
            Search(html, frontier);

        if (report.Limits is { } limits)
            Text(html, "Original resource limits", $"{Number(limits.Cost)} {limits.Currency} minor units, " +
                $"{Number(limits.Disruption)} disruption minutes, staffing {Teams(limits.Staff)}");

        if (report.SearchLimits is { } work)
            Text(html, "Per-search limit",
                $"{Number(work.MaxSearchNodes)} nodes and {work.Timeout.TotalSeconds.ToString("0.###", CultureInfo.InvariantCulture)} seconds");

        html.Append("<details><summary>Versions and evidence pin</summary>");
        Text(html, "Report schema", report.Version);
        Text(html, "Report input fingerprint", report.InputSha256);
        Text(html, "Graph version", report.GraphVersion);
        Text(html, "Graph fingerprint", report.Pin?.GraphSha256);
        Text(html, "Inventory fingerprint", report.Pin?.Binding.InventorySha256);
        Text(html, "Policy version", report.Pin?.Binding.PolicyVersion);
        Text(html, "Engine version", report.Pin?.Binding.EngineVersion);
        Text(html, "Risk model version", report.Pin?.Binding.RiskModelVersion);
        Text(html, "Objective version", report.ObjectiveVersion);
        Text(html, "Constraint version", report.ConstraintVersion);
        Text(html, "Ranking version", report.RankingVersion);
        Text(html, "Solver version", report.Frontier?.SolverVersion);
        html.Append("</details>");

        if (report.Plans.Count == 0)
            html.Append("<p>No proposed plan is available. This is not evidence of safety.</p>");

        for (int i = 0; i < report.Plans.Count; i++)
        {
            html.Append("<section><h2>").Append(i == 0 ? "First feasible proposal" : $"Alternative {Number(i)}").Append("</h2>");
            Plan(html, report.Plans[i]);
            html.Append("</section>");
        }

        if (report.Sensitivities.Count > 0 || report.NotRunSensitivityIds.Count > 0)
        {
            html.Append("<section><h2>Approved sensitivity cases</h2>");

            foreach (var variant in report.Sensitivities)
                Sensitivity(html, variant);
            Text(html, "Not run", Items(report.NotRunSensitivityIds));
            html.Append("</section>");
        }

        return html.Append("</main></body></html>").ToString();
    }

    private static void Plan(StringBuilder html, PortfolioExplanation.Plan explained)
    {
        Summary(html, explained.Alternative);
        html.Append("<details><summary>Selected actions</summary>");
        StartTable(html, "Selected actions and modeled removal effects", "Action", "Reason and dependencies", "Evidence and estimates",
            "Removal bundle", "Modeled points lost");

        foreach (var action in explained.Selected)
        {
            Row(html, action.Id, $"{action.Kind}. " + (action.ExplicitlyMandatory ? "Explicitly mandatory. "
                    : action.RequiredByMandatoryClosure ? "Required by mandatory closure. " : string.Empty)
                    + $"Prerequisites {Items(action.PrerequisiteActionIds)}. Contributing causes {Items(action.ModeledCauseIds)}.",
                $"Findings {Findings(action.Findings)}. {Evidence(action.Evidence)}. {Estimate(action.Estimate)}", Items(action.RemovedWithAction),
                action.ModeledPointsLostOnRemoval);
        }
        EndTable(html);
        html.Append("<p>Removal effects can overlap and must not be added together.</p></details><details>");
        html.Append("<summary>Excluded actions</summary>");
        StartTable(html, "Effects of adding an action to this portfolio", "Action", "Assessment", "Prerequisites and evidence", "Estimate");

        foreach (var action in explained.Excluded)
        {
            string limits = Items(action.ExceededLimits.Select(row => Constraint(row)));
            string conflicts = Items(action.Conflicts.Select(edge => $"{edge.FirstActionId} / {edge.SecondActionId}"));
            string blockers = Items(action.Blockers.Select(Blocker));
            string evidenceIssues = Items(action.EvidenceIssues.Select(e => $"{e.SubjectId} ({e.Reason})"));
            string assessment = action.Finding switch
            {
                PortfolioExplanation.AddFinding.Blocked => $"Blocked for this addition. {blockers}. Limits exceeded {limits}. Conflicts {conflicts}.",
                PortfolioExplanation.AddFinding.NoAdditionalModeledPoints => "Feasible addition with no additional modeled points.",
                _ => $"Feasible addition not selected. Additional modeled points {Number(action.AdditionalModeledPoints)}.",
            };
            Row(html, $"{action.Id} ({action.Kind})", assessment,
                $"Findings {Findings(action.Findings)}. Prerequisites {Items(action.PrerequisiteActionIds)}. " +
                $"Unavailable {Items(action.UnavailableActionIds)}. {evidenceIssues}",
                Estimate(action.Estimate));
        }
        EndTable(html);
        html.Append("<p>These reasons describe addition to this proposal. They do not rule out substitutions or other portfolios.</p></details>");
        html.Append("<details open><summary>Modeled coverage, residual exposure and unknowns</summary>");
        StartTable(html, "Scenario score breakdown", "Scenario", "Cause", "Coverage state", "Weight", "Points", "Evidence");

        foreach (var scenario in explained.Scenarios.OrderBy(row => row.State == PortfolioExplanation.ScenarioState.ModeledCovered)
                     .ThenByDescending(row => row.Critical).ThenBy(row => row.Id, StringComparer.Ordinal))
        {
            string state = scenario.State switch
            {
                PortfolioExplanation.ScenarioState.ModeledCovered => "Modeled covered",
                PortfolioExplanation.ScenarioState.ModeledUncovered => "Modeled uncovered",
                _ => "Unknown coverage",
            };
            Row(html, scenario.Critical ? $"{scenario.Id} (critical)" : scenario.Id, scenario.CauseId,
                state, scenario.Weight, scenario.ContributedPoints, Evidence(scenario.Evidence));
        }
        EndTable(html);
        html.Append("</details>");
    }

    private static void Sensitivity(StringBuilder html, PortfolioExplanation.Sensitivity variant)
    {
        html.Append("<details><summary>").Append(E(variant.Assumptions.Id)).Append("</summary>");
        Text(html, "Approval basis", variant.Assumptions.ApprovalBasisId);
        Text(html, "Cost limit in original currency minor units", variant.Limits.Cost);
        Text(html, "Objective version", variant.ObjectiveVersion);
        Text(html, "Weight overrides", Items(variant.Assumptions.WeightOverrides.Select(row => $"{row.ScenarioId} = {Number(row.Points)}")));
        Search(html, variant.Frontier);

        if (variant.FirstFeasibleAlternative is { } alternative)
            Summary(html, alternative);

        if (variant.Difference is { } difference)
        {
            Text(html, "Added actions", Items(difference.AddedActionIds));
            Text(html, "Removed actions", Items(difference.RemovedActionIds));
            Text(html, "Newly covered scenarios", Items(difference.NewlyCoveredScenarioIds));
            Text(html, "No longer covered scenarios", Items(difference.NoLongerCoveredScenarioIds));
            Text(html, "Modeled points on the original weight scale", difference.PointsOnOriginalScale);
            Text(html, "Change in modeled points on the original scale", difference.DeltaPointsOnOriginalScale);
            Text(html, "Cost change in original currency minor units", difference.DeltaCost);
            Text(html, "Disruption minute change", difference.DeltaDisruption);
            Text(html, "Staffing minute changes", Teams(difference.DeltaStaff));
        }
        else
            html.Append("<p>No comparison is available without a feasible proposal in both cases.</p>");

        html.Append("</details>");
    }

    private static void Summary(StringBuilder html, PortfolioPareto.Alternative option)
    {
        Text(html, "Selected actions", Items(option.Plan.SelectedActionIds));
        Text(html, "Modeled coverage points on this case's weight scale", option.Plan.ModeledCoveragePoints);
        Text(html, "Cost in currency minor units", option.Plan.Usage.Cost);
        Text(html, "Disruption in service-minutes", option.Plan.Usage.Disruption);
        Text(html, "Staffing minutes", Teams(option.Plan.Usage.Staff));
        Text(html, "Binding constraints", Items(option.BindingConstraints.Select(Constraint)));
    }

    private static void Search(StringBuilder html, PortfolioExplanation.Frontier search)
    {
        Text(html, "Search status", search.Status);
        Text(html, "Search fingerprint", search.InputSha256);
        Text(html, "Evaluated search nodes", search.SearchNodes);
        Text(html, "Retained alternatives", search.RetainedAlternatives);

        if (search.Status is PortfolioPareto.Status.WorkLimit or PortfolioPareto.Status.TimeLimit or PortfolioPareto.Status.FrontierLimit
            or PortfolioPareto.Status.Cancelled)
            html.Append("<p>The frontier is incomplete. Returned alternatives do not establish global optimality.</p>");

        if (search.OutputTruncated)
            html.Append("<p>Only a subset of retained alternatives is shown.</p>");

        Text(html, "Planning issues", Items(search.Issues.Select(row => $"{row.SubjectId} ({row.Reason})")));
    }

    private static string Blocker(PortfolioExplanation.AddBlocker blocker) => blocker switch
    {
        PortfolioExplanation.AddBlocker.EvidenceUnavailable => "Evidence or policy eligibility unavailable",
        PortfolioExplanation.AddBlocker.EstimateUnavailable => "Resource estimate missing",
        PortfolioExplanation.AddBlocker.Conflict => "Conflict",
        PortfolioExplanation.AddBlocker.Cost => "Cost cap",
        PortfolioExplanation.AddBlocker.Staffing => "Staffing cap",
        PortfolioExplanation.AddBlocker.Disruption => "Disruption cap",
        _ => "Undetermined",
    };

    private static string Constraint(PortfolioPareto.BindingConstraint constraint) =>
        $"{constraint.Kind}{(constraint.TeamKey is { } team ? $" ({team})" : string.Empty)} = {Number(constraint.Limit)}";

    private static string Estimate(PortfolioActionEstimate? estimate) => estimate is not { } value ? "Estimate unavailable"
        : $"{value.BasisId}. Cost {Number(value.Cost.Units)} ({value.Cost.Kind}). " +
            $"Disruption {Number(value.Disruption.Units)} ({value.Disruption.Kind}). " +
            $"Staffing {(value.Staff is { } staff ? Teams(staff) : "unavailable")} ({value.StaffKind}).";

    private static string Findings(IReadOnlyList<PortfolioExplanation.FindingLink> findings) =>
        Items(findings.Select(row => row.CapturedRank is int rank
            ? $"{row.FindingId:D} (captured rank {Number(rank)})"
            : $"{row.FindingId:D} (not in captured ranking)"));

    private static string Evidence(IReadOnlyList<PortfolioEvidenceReference> records) =>
        Items(records.Select(row => $"{row.Kind} {row.RecordId:D} ({row.Sha256})"));

    private static string Teams(IReadOnlyList<PortfolioTeamMinutes> staff) =>
        Items(staff.Select(row => $"{row.TeamKey} = {Number(row.Minutes)}"));

    private static string Items(IEnumerable<string> values) => string.Join(", ", values.DefaultIfEmpty("None"));
    private static string Number(long? value) => value?.ToString(CultureInfo.InvariantCulture) ?? "Unavailable";
    private static string E(object? value) => HtmlEncoder.Default.Encode(value is null ? "Unavailable" : Convert.ToString(value, CultureInfo.InvariantCulture) ?? "Unavailable");

    private static void Text(StringBuilder html, string label, object? value) => html.Append("<p><strong>")
        .Append(E(label)).Append("</strong> ").Append(E(value)).Append("</p>");

    private static void StartTable(StringBuilder html, string label, params string[] headers)
    {
        html.Append("<table><caption>").Append(E(label)).Append("</caption><thead><tr>");

        foreach (string header in headers)
            html.Append("<th scope=\"col\">").Append(E(header)).Append("</th>");
        html.Append("</tr></thead><tbody>");
    }

    private static void Row(StringBuilder html, params object?[] cells)
    {
        html.Append("<tr>");

        foreach (object? cell in cells)
            html.Append("<td>").Append(E(cell)).Append("</td>");
        html.Append("</tr>");
    }

    private static void EndTable(StringBuilder html) => html.Append("</tbody></table>");
}
