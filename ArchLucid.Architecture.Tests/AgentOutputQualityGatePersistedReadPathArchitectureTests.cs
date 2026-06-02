using System.Reflection;
using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-012 (read path): downstream consumers read persisted evaluation rows or orchestration aggregates — they do not
///     inject <see cref="Core.AgentEvaluation.IAgentOutputQualityGate" /> in Application for sponsor/report surfaces.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGatePersistedReadPathArchitectureTests
{
    [Fact]
    public void ArchLucid_Application_does_not_inject_quality_gate_evaluator()
    {
        Assembly application = typeof(PilotRunDeltaComputer).Assembly;
        Type gateInterface = typeof(Core.AgentEvaluation.IAgentOutputQualityGate);

        List<string> violations = [];

        foreach (Type type in application.GetTypes())
        {
            if (!type.IsClass || type.IsAbstract)
                continue;

            foreach (ConstructorInfo ctor in type.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                foreach (ParameterInfo parameter in ctor.GetParameters())
                {
                    if (parameter.ParameterType != gateInterface)
                        continue;

                    violations.Add($"{type.FullName}({parameter.Name})");
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-012 read path: Application must resolve gate outcomes via persisted rows or allow-listed runtime aggregators, not IAgentOutputQualityGate: "
            + string.Join("; ", violations));
    }

    [Fact]
    public void Agent_output_evaluation_recorder_persists_quality_gate_passed_to_repository()
    {
        string path = SourcePathFor(typeof(AgentOutputEvaluationRecorder));
        string text = File.ReadAllText(path, Encoding.UTF8);

        text.Should().Contain("QualityGatePassed = qualityGatePassed");
        text.Should().Contain("_agentOutputEvaluationRepository");
        text.Should().Contain("AppendAsync");
    }

    [Fact]
    public void Prompt_variant_stats_repository_reads_persisted_quality_gate_pass_rate()
    {
        string path = SourcePathFor(typeof(SqlPromptVariantStatsRepository));
        string text = File.ReadAllText(path, Encoding.UTF8);

        text.Should().Contain("dbo.AgentOutputEvaluations");
        text.Should().Contain("QualityGatePassed");
        text.Should().Contain("QualityGatePassRate");
    }

    private static string SourcePathFor(Type anchorType)
    {
        string repoRoot = FindRepoRoot();
        string needle = $"{Path.DirectorySeparatorChar}{anchorType.Name}.cs";

        string? match = Directory
            .EnumerateFiles(repoRoot, $"{anchorType.Name}.cs", SearchOption.AllDirectories)
            .FirstOrDefault(path =>
                path.Contains(needle, StringComparison.OrdinalIgnoreCase)
                && !path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
                && !path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase));

        match.Should().NotBeNull($"Could not locate source for {anchorType.FullName}");

        return match!;
    }

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }
}
