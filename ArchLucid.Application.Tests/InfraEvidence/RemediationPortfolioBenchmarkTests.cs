using System.Diagnostics;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[CollectionDefinition("FND093 isolated benchmark", DisableParallelization = true)]
public sealed class RemediationPortfolioBenchmarkCollection { }

[Collection("FND093 isolated benchmark")]
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioBenchmarkTests
{
    private const string Cohort = "FND093-synthetic-estates-v1";
    private const string Reference = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    [Fact]
    public void Versioned_cohort_records_feasible_quality_and_resource_measurements_on_identical_inputs()
    {
        var optimizer = new BoundedRemediationPortfolioOptimizer(TimeProvider.System);
        using var process = Process.GetCurrentProcess();
        decimal? hourlyRate = ReadCpuHourRate();
        List<PortfolioBenchmarkMeasurement> rows = [];
        foreach (var (size, complexity, caseId) in new[] { (8, 2, "small"), (32, 4, "medium"), (96, 7, "large-constrained") })
        {
            var (pin, graph, request) = CreateFixture(size, complexity);
            _ = optimizer.Optimize(pin, graph, request);
            process.Refresh();
            var cpuBefore = process.TotalProcessorTime;
            long allocationBefore = GC.GetAllocatedBytesForCurrentThread();
            long timestamp = Stopwatch.GetTimestamp();
            var result = optimizer.Optimize(pin, graph, request);
            var wall = Stopwatch.GetElapsedTime(timestamp);
            long allocated = GC.GetAllocatedBytesForCurrentThread() - allocationBefore;
            process.Refresh();
            var cpu = process.TotalProcessorTime - cpuBefore;
            Assert.Contains(result.Status, new[] { PortfolioOptimizationStatus.Optimal, PortfolioOptimizationStatus.WorkLimit });
            Assert.Equal(PortfolioBaselineStatus.Completed, result.TopN.Status);
            Assert.Equal(PortfolioBaselineStatus.Completed, result.Greedy.Status);

            var exact = Assert.IsType<PortfolioAdvisoryPlan>(result.BestFeasiblePlan);
            var top = Assert.IsType<PortfolioAdvisoryPlan>(result.TopN.Plan);
            var greedy = Assert.IsType<PortfolioAdvisoryPlan>(result.Greedy.Plan);
            foreach (var plan in new[] { top, greedy, exact })
                RecheckPlan(plan, graph, request);

            Assert.True(exact.ModeledCoveragePoints > 0);
            Assert.True(exact.ModeledCoveragePoints >= top.ModeledCoveragePoints);
            Assert.True(exact.ModeledCoveragePoints >= greedy.ModeledCoveragePoints);
            Assert.InRange(result.UpperBoundPoints!.Value, exact.ModeledCoveragePoints, request.ScenarioWeights.Sum(row => row.Points));
            Assert.Equal(result.UpperBoundPoints - exact.ModeledCoveragePoints, result.OptimalityGapPoints);

            var repeat = optimizer.Optimize(pin, graph, request);
            Assert.Equal(result.InputSha256, repeat.InputSha256);
            Assert.Equal(result.BestFeasiblePlan!.SelectedActionIds, repeat.BestFeasiblePlan!.SelectedActionIds);
            Assert.Equal(result.EvaluatedSearchNodes, repeat.EvaluatedSearchNodes);

            long milliseconds = (long)Math.Ceiling(wall.TotalMilliseconds);
            long cpuMilliseconds = (long)Math.Ceiling(cpu.TotalMilliseconds);
            rows.Add(new(caseId, result.InputSha256!, true, exact.ModeledCoveragePoints, top.ModeledCoveragePoints,
                greedy.ModeledCoveragePoints, result.UpperBoundPoints, result.EvaluatedSearchNodes, result.TopN.Evaluations,
                result.Greedy.Evaluations, milliseconds, cpuMilliseconds, process.PeakWorkingSet64, allocated,
                hourlyRate * cpuMilliseconds / 3_600_000m));
        }

        Assert.All(rows, row => Assert.True(row.ProcessPeakWorkingSetBytes > 0));
        var report = new PortfolioBenchmarkReport(Cohort, BoundedRemediationPortfolioOptimizer.Version, rows.AsReadOnly())
        {
            MeasurementEnvironment = $"{Environment.OSVersion.Platform}; .NET {Environment.Version}; logical CPUs {Environment.ProcessorCount}",
            UsdPerCpuHour = hourlyRate,
        };
        string? outputPath = Environment.GetEnvironmentVariable("FND093_BENCHMARK_REPORT");
        if (!string.IsNullOrWhiteSpace(outputPath))
        {
            string fullPath = Path.GetFullPath(outputPath);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            File.WriteAllText(fullPath, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
        }
    }

    private static void RecheckPlan(PortfolioAdvisoryPlan plan, RemediationPortfolioGraph graph, PortfolioOptimizationRequest request)
    {
        var selected = plan.SelectedActionIds.ToHashSet(StringComparer.Ordinal);
        Assert.Equal(plan.SelectedActionIds.Count, selected.Count);
        Assert.All(request.MandatoryActionIds, id => Assert.Contains(id, selected));
        Assert.All(graph.Relationships, edge =>
        {
            if (!selected.Contains(edge.FirstActionId))
                return;
            if (edge.Relationship == PortfolioRelationship.Requires)
                Assert.Contains(edge.SecondActionId, selected);
            if (edge.Relationship == PortfolioRelationship.Conflicts)
                Assert.DoesNotContain(edge.SecondActionId, selected);
        });
        var estimates = request.Estimates.Where(item => selected.Contains(item.ActionId)).ToArray();
        Assert.Equal(estimates.Length, selected.Count);
        Assert.Equal(plan.Usage.Cost, estimates.Sum(row => row.Cost.Units!.Value));
        Assert.Equal(plan.Usage.Disruption, estimates.Sum(row => row.Disruption.Units!.Value));
        Assert.InRange(plan.Usage.Cost, 0, request.Limits.Cost);
        Assert.InRange(plan.Usage.Disruption, 0, request.Limits.Disruption);
        foreach (var limit in request.Limits.Staff)
        {
            long used = estimates.Sum(row => row.Staff!.Where(staff => staff.TeamKey == limit.TeamKey).Sum(staff => staff.Minutes));
            Assert.InRange(used, 0, limit.Minutes);
            Assert.Contains(new PortfolioTeamMinutes(limit.TeamKey, used), plan.Usage.Staff);
        }
        var covered = graph.Coverage.Where(clause => clause.AllActionIds.All(selected.Contains))
            .Select(clause => clause.ScenarioId).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
        Assert.Equal(covered, plan.CoveredScenarioIds);
        Assert.Equal(request.ScenarioWeights.Where(row => covered.Contains(row.ScenarioId)).Sum(row => row.Points),
            plan.ModeledCoveragePoints);
    }

    private static (PortfolioOptimizationPin Pin, RemediationPortfolioGraph Graph, PortfolioOptimizationRequest Request)
        CreateFixture(int size, int complexity)
    {
        var scope = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Id(1), Id(2), Id(3)), Id(size));
        var binding = new PortfolioBinding(scope, Reference, "fixture-policy", "fixture-engine", "fixture-risk-model");
        var actions = Enumerable.Range(0, size).Select(i => new PortfolioActionNode(Action(i), "reviewed-control",
            Id(100 + i), Id(1_000 + i), Id(2_000 + i), [Id(3_000 + i)], [], true)).ToArray();
        var scenarios = Enumerable.Range(0, size / 2).Select(i => new PortfolioScenarioNode(Scenario(i), "cause", [], [], true)).ToArray();
        var clauses = Enumerable.Range(0, scenarios.Length).SelectMany(i => new PortfolioCoverageClause[]
        {
            new(Scenario(i), [Action(2 * i)], []),
            new(Scenario(i), [Action(2 * i + 1), Action(2 * ((i + 1) % scenarios.Length))], []),
        });
        var edges = Enumerable.Range(2, size - 2).SelectMany(i =>
            i % complexity == 0 ? new[] { new PortfolioRelationshipEdge(Action(i), Action(i - 1), PortfolioRelationship.Requires, []) }
            : i % complexity == 1 && i + 1 < size
                ? [new PortfolioRelationshipEdge(Action(i), Action(i + 1), PortfolioRelationship.Conflicts, [])] : []);
        var graph = new RemediationPortfolioGraph(binding, Reference, true, actions, [], scenarios, edges, clauses, []);
        var pin = new PortfolioOptimizationPin(binding, graph.GraphSha256);
        int resourceBudget = size < 16 ? size + 2 : 3 * size / 5;
        var request = new PortfolioOptimizationRequest(pin, "fixture-objective-v1", "fixture-constraints-v1",
            new("USD", resourceBudget, [new("ops", resourceBudget), new("review", size / 2)], size / 2),
            scenarios.Select((row, i) => new PortfolioScenarioWeight(row.Id, 1 + ((3 * i) % 23))).ToArray(),
            actions.Select((row, i) => new PortfolioActionEstimate(row.Id, "fixture-estimate",
                new(1 + (i % 3), PortfolioEstimateKind.ApprovedDefault),
                [new("ops", i % 5), new("review", i % 3)], PortfolioEstimateKind.ApprovedDefault,
                new(i % 3, PortfolioEstimateKind.ApprovedDefault))).ToArray(),
            [Action(0)], new(pin, "fixture-ranked-input", actions.SelectMany(action => action.FindingIds).ToArray(), size / 2),
            new(2_000, 8_192, TimeSpan.FromSeconds(10)));
        return (pin, graph, request);
    }

    private static decimal? ReadCpuHourRate()
    {
        var text = Environment.GetEnvironmentVariable("FND093_USD_PER_CPU_HOUR");
        if (string.IsNullOrWhiteSpace(text))
            return null;
        if (!decimal.TryParse(text, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var rate)
            || rate <= 0 || rate > 10_000m)
            throw new InvalidOperationException("Invalid FND093_USD_PER_CPU_HOUR.");
        return rate;
    }

    private static string Action(int i) => $"action-{i:D3}";
    private static string Scenario(int i) => $"scenario-{i:D3}";
    private static Guid Id(int n) => new(n, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
}
