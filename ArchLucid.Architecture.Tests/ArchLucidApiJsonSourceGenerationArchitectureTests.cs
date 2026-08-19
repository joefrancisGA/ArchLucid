using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-2162 — API JSON uses per-slice source-generated contexts with reflection fallback.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchLucidApiJsonSourceGenerationArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb2162_mvc_json_options_delegate_to_ArchLucidApiJsonSerializerOptions()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api", "Startup", "MvcExtensions.cs");
        string text = File.ReadAllText(path);

        text.Should().Contain("ArchLucidApiJsonSerializerOptions.Configure");
        text.Should().NotContain("options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase");
    }

    [Fact]
    public void Tb2162_hot_slice_json_contexts_exist_and_chain_reflection_fallback()
    {
        string chainPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Api",
            "Serialization",
            "ArchLucidApiJsonTypeInfoResolverChain.cs");
        string chainText = File.ReadAllText(chainPath);

        chainText.Should().Contain("AuthApiJsonSerializerContext.Default");
        chainText.Should().Contain("RunsApiJsonSerializerContext.Default");
        chainText.Should().Contain("FindingsApiJsonSerializerContext.Default");
        chainText.Should().Contain("AuditApiJsonSerializerContext.Default");
        chainText.Should().Contain("ProblemDetailsApiJsonSerializerContext.Default");
        chainText.Should().Contain("new DefaultJsonTypeInfoResolver()");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Api", "Serialization", "AuthApiJsonSerializerContext.cs"))
            .Should()
            .BeTrue();
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Architecture.Tests", "ArchLucidApiJsonSourceGenerationTests.cs"))
            .Should()
            .BeTrue();
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
