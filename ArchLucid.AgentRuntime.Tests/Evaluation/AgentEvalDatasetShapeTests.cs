using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

/// <summary>
///     Keeps <c>tests/eval-datasets</c> aligned with <c>scripts/ci/eval_agent_quality.py</c> (shape-only until
///     deterministic eval runs exist).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentEvalDatasetShapeTests
{
    private static string EvalDatasetsDirectory()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");
            if (File.Exists(sln))
            {
                string root = Path.Combine(dir.FullName, "tests", "eval-datasets");
                if (Directory.Exists(root))
                {
                    return root;
                }
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not resolve tests/eval-datasets from test output directory.");
    }

    [SkippableFact]
    public void Manifest_and_dataset_files_meet_minimum_shape()
    {
        string root = EvalDatasetsDirectory();
        string manifestPath = Path.Combine(root, "manifest.json");
        File.Exists(manifestPath).Should().BeTrue();

        JsonDocument manifest = JsonDocument.Parse(File.ReadAllText(manifestPath));
        JsonElement rootEl = manifest.RootElement;
        rootEl.GetProperty("schemaVersion").GetInt32().Should().Be(2);

        rootEl.TryGetProperty("minRequiredCategories", out JsonElement minReq).Should().BeTrue();
        minReq.GetInt32().Should().BeGreaterThanOrEqualTo(1);

        JsonElement datasets = rootEl.GetProperty("datasets");
        datasets.GetArrayLength().Should().BeGreaterThan(0);

        foreach (JsonElement entry in datasets.EnumerateArray())
        {
            string rel = entry.GetProperty("relativePath").GetString()!;
            int minCases = entry.GetProperty("minCases").GetInt32();
            string dataPath = Path.Combine(root, rel);
            File.Exists(dataPath).Should().BeTrue();

            JsonDocument data = JsonDocument.Parse(File.ReadAllText(dataPath));
            data.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
            data.RootElement.GetArrayLength().Should().BeGreaterThanOrEqualTo(minCases);

            foreach (JsonElement caseEl in data.RootElement.EnumerateArray())
            {
                caseEl.TryGetProperty("architecturalContext", out JsonElement ctx).Should().BeTrue();
                ctx.ValueKind.Should().Be(JsonValueKind.Object);

                JsonElement expect = caseEl.GetProperty("expect");
                expect.TryGetProperty("requiredCategories", out JsonElement reqCat).Should().BeTrue();
                reqCat.ValueKind.Should().Be(JsonValueKind.Array);
                reqCat.GetArrayLength().Should().BeGreaterThan(0);
                expect.TryGetProperty("forbiddenCategories", out JsonElement forbCat).Should().BeTrue();
                forbCat.ValueKind.Should().Be(JsonValueKind.Array);
            }
        }

        rootEl.TryGetProperty("promptInjectionRegression", out JsonElement pir).Should().BeTrue();
        pir.ValueKind.Should().Be(JsonValueKind.Object);

        pir.TryGetProperty("relativePaths", out JsonElement piPaths).Should().BeTrue();
        piPaths.ValueKind.Should().Be(JsonValueKind.Array);
        piPaths.GetArrayLength().Should().BeGreaterThan(0);

        pir.TryGetProperty("minTotalCases", out JsonElement minPi).Should().BeTrue();
        int minTotalPi = minPi.GetInt32();
        minTotalPi.Should().BeGreaterThan(0);

        int countedPi = 0;

        foreach (JsonElement relEl in piPaths.EnumerateArray())
        {
            string rel = relEl.GetString()!;
            string piPath = Path.Combine(root, rel.Replace('/', Path.DirectorySeparatorChar));
            File.Exists(piPath).Should().BeTrue();

            JsonDocument piDoc = JsonDocument.Parse(File.ReadAllText(piPath));
            piDoc.RootElement.ValueKind.Should().Be(JsonValueKind.Array);

            foreach (JsonElement row in piDoc.RootElement.EnumerateArray())
            {
                row.TryGetProperty("id", out _).Should().BeTrue();
                row.TryGetProperty("category", out _).Should().BeTrue();
                row.TryGetProperty("userPrompt", out _).Should().BeTrue();
                row.TryGetProperty("expectedBlockedAt", out _).Should().BeTrue();
            }

            countedPi += piDoc.RootElement.GetArrayLength();
        }

        countedPi.Should().BeGreaterThanOrEqualTo(minTotalPi);

        string piDir = Path.Combine(root, "prompt-injection");
        string[] extraOnDisk = Directory.GetFiles(piDir, "*.json").Select(f => Path.GetFileName(f)!).ToArray();
        string[] fromManifest = piPaths
            .EnumerateArray()
            .Select(e => Path.GetFileName(e.GetString()!.Replace('/', Path.DirectorySeparatorChar))!)
            .ToArray();

        extraOnDisk.OrderBy(x => x).Should().Equal(fromManifest.OrderBy(x => x));
    }
}
