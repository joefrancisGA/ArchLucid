using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC28c package-coverage batch: tenant-scoped table registry JSON load/normalize and analyzer descriptor smoke.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc28cTests
{
    [Fact]
    public void TenantScopedTableRegistry_LoadFromAdditionalFile_parses_arrays()
    {
        const string json =
            """
            {
              "scopeTripleOnRow": ["dbo.Runs", "dbo.Findings"],
              "tenantIdOnRow": ["dbo.TenantSettings"]
            }
            """;

        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile(json);

        registry.RequiresTripleScope("dbo.Runs").Should().BeTrue();
        registry.RequiresTripleScope("dbo.Findings").Should().BeTrue();
        registry.RequiresTenantIdScope("dbo.TenantSettings").Should().BeTrue();
        registry.IsTenantScoped("dbo.Runs").Should().BeTrue();
        registry.IsTenantScoped("dbo.Widgets").Should().BeFalse();
    }

    [Fact]
    public void TenantScopedTableRegistry_LoadFromAdditionalFile_blank_or_invalid_returns_empty()
    {
        TenantScopedTableRegistry.LoadFromAdditionalFile(null).Should().BeSameAs(TenantScopedTableRegistry.Empty);
        TenantScopedTableRegistry.LoadFromAdditionalFile("  ").Should().BeSameAs(TenantScopedTableRegistry.Empty);
        TenantScopedTableRegistry.LoadFromAdditionalFile("{ \"nope\": true }").Should().BeSameAs(TenantScopedTableRegistry.Empty);
    }

    [Theory]
    [InlineData("dbo.Runs", "dbo.Runs")]
    [InlineData("  dbo.Findings  ", "dbo.Findings")]
    [InlineData("Runs", "dbo.Runs")]
    [InlineData("", null)]
    [InlineData("dbo.bad-name!", null)]
    public void TenantScopedTableRegistry_NormalizeTableName(string raw, string? expected)
    {
        TenantScopedTableRegistry.NormalizeTableName(raw).Should().Be(expected);
    }

    [Fact]
    public void DirectHttpClientConstructionAnalyzer_and_NakedDateTimeAnalyzer_expose_descriptors()
    {
        DirectHttpClientConstructionAnalyzer http = new();
        http.SupportedDiagnostics.Should().NotBeEmpty();

        NakedDateTimeAnalyzer naked = new();
        naked.SupportedDiagnostics.Should().NotBeEmpty();

        MutableStaticAnalyzer mutable = new();
        mutable.SupportedDiagnostics.Should().NotBeEmpty();
    }

    [Fact]
    public void MissingCancellationTokenAnalyzer_compiles_probe_without_diagnostics_for_empty_class()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc28c",
            [CSharpSyntaxTree.ParseText("public class Probe { }")],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        compilation.GetDiagnostics().Should().NotContain(d => d.Severity == DiagnosticSeverity.Error);
        MissingCancellationTokenAnalyzer analyzer = new();
        analyzer.SupportedDiagnostics.Should().NotBeEmpty();
    }
}
