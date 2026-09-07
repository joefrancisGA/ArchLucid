using System.Text.Json;

using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Regenerates on-disk golden files (local only). Excluded from default CI filters.</summary>
[Trait("Category", "GoldenCorpusRecord")]
public sealed class GoldenCorpusMaterializerTests
{
    private const int CaseCount = 30;

    /// <summary>
    /// Set <c>ARCHLUCID_RECORD_DECISIONING_GOLDEN=1</c> to rewrite <c>tests/golden-corpus/decisioning/**</c> from current
    /// decisioning behavior (no LLM; frozen clock + simulator-only engines).
    /// </summary>
    [Fact]
    public async Task Record_all_cases_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;


        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue("compliance rule pack must be copied to test output.");

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        string root = GoldenCorpusRepoPaths.CorpusSourceDirectory;
        Directory.CreateDirectory(root);

        IReadOnlyList<GoldenCorpusCaseDefinition> cases = GoldenCorpusGraphFactory.BuildCases(CaseCount);

        foreach (GoldenCorpusCaseDefinition def in cases)
        {
            string dir = Path.Combine(root, def.CaseFolderName);
            Directory.CreateDirectory(dir);

            GoldenCorpusInputDocument input = new()
            {
                RunId = def.Graph.RunId,
                ContextSnapshotId = def.Graph.ContextSnapshotId,
                GraphSnapshot = def.Graph,
                Merge = def.Merge is null
                    ? null
                    : ToMergeDocument(def.Merge),
            };

            string inputJson = JsonSerializer.Serialize(input, GoldenCorpusJson.SerializerOptions);
            await File.WriteAllTextAsync(Path.Combine(dir, "input.json"), inputJson);

            CollectingAuditService audit = new();
            GoldenCorpusRunArtifacts artifacts = await harness.RunAsync(
                def.Graph.RunId,
                def.Graph.ContextSnapshotId,
                def.Graph,
                audit,
                def.Merge,
                CancellationToken.None,
                null);

            await File.WriteAllTextAsync(Path.Combine(dir, "expected-findings.json"), artifacts.FindingsJson);
            await File.WriteAllTextAsync(Path.Combine(dir, "expected-decisions.json"), artifacts.DecisionsJson);
            await File.WriteAllTextAsync(Path.Combine(dir, "expected-audit-types.json"), artifacts.AuditTypesJson);

            string readme =
                $"# {def.CaseFolderName}\n\n{def.ReadmeTitle}\n\nRegenerated with `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1`.\n";
            await File.WriteAllTextAsync(Path.Combine(dir, "README.md"), readme);
        }
    }

    [Fact]
    public async Task Record_hand_authored_cases_33_34_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;

        await RecordHandAuthoredCaseAsync("case-33");
        await RecordHandAuthoredCaseAsync("case-34");
    }

    [Fact]
    public async Task Record_hand_authored_case_35_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;

        GraphSnapshot graph = GoldenCorpusActorEngineGraphFactory.CreateDeclarationSeededActorGraph();
        GoldenCorpusInputDocument input = new()
        {
            RunId = graph.RunId,
            ContextSnapshotId = graph.ContextSnapshotId,
            GraphSnapshot = graph,
            Merge = null,
        };

        string dir = Path.Combine(GoldenCorpusRepoPaths.CorpusSourceDirectory, "case-35");
        Directory.CreateDirectory(dir);

        string inputJson = JsonSerializer.Serialize(input, GoldenCorpusJson.SerializerOptions);
        await File.WriteAllTextAsync(Path.Combine(dir, "input.json"), inputJson);

        await RecordHandAuthoredCaseAsync("case-35");
    }

    [Fact]
    public async Task Record_hand_authored_case_36_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;

        GraphSnapshot graph = GoldenCorpusActorEngineGraphFactory.CreateLegacyMixedOriginActorGraph();
        GoldenCorpusInputDocument input = new()
        {
            RunId = graph.RunId,
            ContextSnapshotId = graph.ContextSnapshotId,
            GraphSnapshot = graph,
            Merge = null,
        };

        string dir = Path.Combine(GoldenCorpusRepoPaths.CorpusSourceDirectory, "case-36");
        Directory.CreateDirectory(dir);

        string inputJson = JsonSerializer.Serialize(input, GoldenCorpusJson.SerializerOptions);
        await File.WriteAllTextAsync(Path.Combine(dir, "input.json"), inputJson);

        await RecordHandAuthoredCaseAsync("case-36");
    }

    [Fact]
    public async Task Record_hand_authored_case_37_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;

        GraphSnapshot graph = GoldenCorpusInventoryContradictionGraphFactory.CreateDeclarationDisabledInventoryEnabledGraph();
        GoldenCorpusInputDocument input = new()
        {
            RunId = graph.RunId,
            ContextSnapshotId = graph.ContextSnapshotId,
            GraphSnapshot = graph,
            Merge = null,
            InventoryFixture = GoldenCorpusInventoryContradictionGraphFactory.CreateMismatchInventoryFixture(),
        };

        string dir = Path.Combine(GoldenCorpusRepoPaths.CorpusSourceDirectory, "case-37");
        Directory.CreateDirectory(dir);

        string inputJson = JsonSerializer.Serialize(input, GoldenCorpusJson.SerializerOptions);
        await File.WriteAllTextAsync(Path.Combine(dir, "input.json"), inputJson);

        await RecordHandAuthoredCaseAsync("case-37");
    }

    private static async Task RecordHandAuthoredCaseAsync(string caseFolderName)
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue("compliance rule pack must be copied to test output.");

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        string dir = Path.Combine(GoldenCorpusRepoPaths.CorpusSourceDirectory, caseFolderName);

        string inputPath = Path.Combine(dir, "input.json");
        File.Exists(inputPath).Should().BeTrue($"missing {inputPath}");

        string inputJson = await File.ReadAllTextAsync(inputPath);
        GoldenCorpusInputDocument? input =
            JsonSerializer.Deserialize<GoldenCorpusInputDocument>(inputJson, GoldenCorpusJson.SerializerOptions);

        input.Should().NotBeNull();

        CollectingAuditService audit = new();
        GoldenCorpusMergeInput? merge = input!.Merge?.ToModel();

        GoldenCorpusRunArtifacts artifacts = await harness.RunAsync(
            input.RunId,
            input.ContextSnapshotId,
            input.GraphSnapshot,
            audit,
            merge,
            CancellationToken.None,
            input.InventoryFixture);

        await File.WriteAllTextAsync(Path.Combine(dir, "expected-findings.json"), artifacts.FindingsJson);
        await File.WriteAllTextAsync(Path.Combine(dir, "expected-decisions.json"), artifacts.DecisionsJson);
        await File.WriteAllTextAsync(Path.Combine(dir, "expected-audit-types.json"), artifacts.AuditTypesJson);
    }

    [Fact]
    public async Task Record_all_existing_cases_from_input_when_env_flag_set()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_DECISIONING_GOLDEN"), "1", StringComparison.Ordinal))
            return;

        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue("compliance rule pack must be copied to test output.");

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        string root = GoldenCorpusRepoPaths.CorpusSourceDirectory;

        List<string> dirs = Directory.GetDirectories(root)
            .OrderBy(static d => d, StringComparer.OrdinalIgnoreCase)
            .ToList();

        dirs.Should().NotBeEmpty();

        foreach (string dir in dirs)
        {
            string inputPath = Path.Combine(dir, "input.json");
            File.Exists(inputPath).Should().BeTrue($"missing input.json in {dir}");

            string inputJson = await File.ReadAllTextAsync(inputPath);
            GoldenCorpusInputDocument? input =
                JsonSerializer.Deserialize<GoldenCorpusInputDocument>(inputJson, GoldenCorpusJson.SerializerOptions);

            input.Should().NotBeNull();

            CollectingAuditService audit = new();
            GoldenCorpusMergeInput? merge = input!.Merge?.ToModel();

            GoldenCorpusRunArtifacts artifacts = await harness.RunAsync(
                input.RunId,
                input.ContextSnapshotId,
                input.GraphSnapshot,
                audit,
                merge,
                CancellationToken.None,
                input.InventoryFixture);

            await File.WriteAllTextAsync(Path.Combine(dir, "expected-findings.json"), artifacts.FindingsJson);
            await File.WriteAllTextAsync(Path.Combine(dir, "expected-decisions.json"), artifacts.DecisionsJson);
            await File.WriteAllTextAsync(Path.Combine(dir, "expected-audit-types.json"), artifacts.AuditTypesJson);
        }
    }

    private static GoldenCorpusMergeDocument ToMergeDocument(GoldenCorpusMergeInput merge) => new()
    {
        MergeRunId = merge.MergeRunId,
        ManifestVersion = merge.ManifestVersion,
        Request = merge.Request,
        AgentResults = merge.AgentResults.ToList(),
        Evaluations = merge.Evaluations.ToList(),
        DecisionNodes = merge.DecisionNodes.ToList(),
        ParentManifestVersion = merge.ParentManifestVersion,
    };
}
