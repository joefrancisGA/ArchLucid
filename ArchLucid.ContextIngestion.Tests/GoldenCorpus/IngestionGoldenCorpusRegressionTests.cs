using System.Text.Json;

using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;

using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests.GoldenCorpus;

/// <summary>Golden regression for context ingestion (Terraform show JSON + document lines). No LLM.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "GoldenCorpus")]
public sealed class IngestionGoldenCorpusRegressionTests
{
    private static readonly JsonSerializerOptions JsonOptions = GoldenCorpusJson.SerializerOptions;

    private readonly TerraformShowJsonInfrastructureDeclarationParser _terraform =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    private readonly BicepInfrastructureDeclarationParser _bicep = new();

    private readonly KubernetesJsonInfrastructureDeclarationParser _kubernetesJson =
        new(NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);

    private readonly KubernetesYamlInfrastructureDeclarationParser _kubernetesYaml =
        new(NullLogger<KubernetesYamlInfrastructureDeclarationParser>.Instance);

    private readonly PlainTextContextDocumentParser _documents = new();

    [Theory]
    [InlineData("case-01")]
    [InlineData("case-02")]
    [InlineData("case-04")]
    [InlineData("case-05")]
    [InlineData("case-06")]
    [InlineData("case-07")]
    [InlineData("case-08")]
    [InlineData("case-09")]
    public async Task Infrastructure_case_matches_golden(string caseName)
    {
        IngestionGoldenCaseFile? file = await ReadCaseFileAsync(caseName);
        file.Should().NotBeNull();
        file.InfrastructureDeclaration.Should().NotBeNull();

        InfrastructureDeclarationReference decl =
            IngestionGoldenCaseInputDtos.ToDeclaration(file.InfrastructureDeclaration!);
        IReadOnlyList<CanonicalObject> objects = await ParseInfrastructureDeclarationAsync(decl);

        await AssertMatchesExpectedAsync(caseName, objects);
    }

    [Fact]
    public async Task Document_case_03_matches_golden()
    {
        IngestionGoldenCaseFile? file = await ReadCaseFileAsync("case-03");
        file.Should().NotBeNull();
        file.Document.Should().NotBeNull();

        ContextDocumentReference doc = IngestionGoldenCaseInputDtos.ToDocument(file.Document!);
        IReadOnlyList<CanonicalObject> objects = await _documents.ParseAsync(doc, CancellationToken.None);

        await AssertMatchesExpectedAsync("case-03", objects);
    }

    private Task<IReadOnlyList<CanonicalObject>> ParseInfrastructureDeclarationAsync(
        InfrastructureDeclarationReference declaration)
    {
        string format = declaration.Format?.Trim() ?? string.Empty;

        if (string.Equals(format, "bicep", StringComparison.OrdinalIgnoreCase))
            return _bicep.ParseAsync(declaration, CancellationToken.None);

        if (string.Equals(format, "kubernetes-json", StringComparison.OrdinalIgnoreCase))
            return _kubernetesJson.ParseAsync(declaration, CancellationToken.None);

        if (string.Equals(format, "kubernetes-yaml", StringComparison.OrdinalIgnoreCase))
            return _kubernetesYaml.ParseAsync(declaration, CancellationToken.None);

        return _terraform.ParseAsync(declaration, CancellationToken.None);
    }

    private static async Task<IngestionGoldenCaseFile?> ReadCaseFileAsync(string caseName)
    {
        string path = Path.Combine(IngestionGoldenCorpusPaths.CorpusOutputDirectory, caseName, "input.json");
        if (!File.Exists(path))
            return null;

        string json = await File.ReadAllTextAsync(path);
        return JsonSerializer.Deserialize<IngestionGoldenCaseFile>(json, JsonOptions);
    }

    private static async Task AssertMatchesExpectedAsync(string caseName, IReadOnlyList<CanonicalObject> objects)
    {
        string expectedPath = Path.Combine(IngestionGoldenCorpusPaths.CorpusOutputDirectory, caseName, "expected-output.json");
        File.Exists(expectedPath).Should().BeTrue($"missing {expectedPath}");

        string expectedRaw = await File.ReadAllTextAsync(expectedPath);
        string actualJson = JsonSerializer.Serialize(
            objects.Select(
                    static o => new
                    {
                        o.ObjectType,
                        o.Name,
                        o.SourceType,
                        o.SourceId,
                        properties = o.Properties.OrderBy(static p => p.Key, StringComparer.Ordinal)
                            .ToDictionary(static p => p.Key, static p => p.Value, StringComparer.Ordinal)
                    })
                .ToList(),
            JsonOptions);

        string n1 = IngestionGoldenOutputNormalizer.Normalize(expectedRaw);
        string n2 = IngestionGoldenOutputNormalizer.Normalize(actualJson);
        n2.Should().Be(n1, $"golden mismatch for ingestion/{caseName}");
    }
}