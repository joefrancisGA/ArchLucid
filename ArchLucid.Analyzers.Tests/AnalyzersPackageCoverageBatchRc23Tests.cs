using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc23Tests
{
    [Fact]
    public void RequireAuthorizationAnalyzer_exposes_al0001_descriptor()
    {
        RequireAuthorizationAnalyzer analyzer = new();

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == "AL0001");
    }

    [Fact]
    public void MutatingControllerAuditAnalyzer_exposes_al0003_descriptor()
    {
        MutatingControllerAuditAnalyzer analyzer = new();

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == "AL0003");
    }

    [Fact]
    public void TenantScopedQueryScopeBindingAnalyzer_exposes_arch006_family()
    {
        TenantScopedQueryScopeBindingAnalyzer analyzer = new();

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id.StartsWith("ARCH006"));
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_with_scope_helper_copies_sql_text()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult resolved =
            new("SELECT 1 FROM dbo.Runs", isStaticallyResolved: true, hasScopeHelperInvocation: false);

        TenantScopedSqlExpressionResolver.ResolutionResult withHelper = resolved.WithScopeHelper(true);

        withHelper.HasScopeHelperInvocation.Should().BeTrue();
        withHelper.SqlText.Should().Be("SELECT 1 FROM dbo.Runs");
    }

    [Fact]
    public void ForeachToLinqCodeFixProvider_registers_batch_fix_all_provider()
    {
        ForeachToLinqCodeFixProvider provider = new();

        provider.GetFixAllProvider().Should().NotBeNull();
        provider.FixableDiagnosticIds.Should().Contain(Al0002ForeachToLinqDescriptor.Rule.Id);
    }

    [Fact]
    public void TenantIdentityBoundaryTypeSymbols_resolve_returns_empty_when_http_context_unreferenced()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc23",
            [CSharpSyntaxTree.ParseText("class Probe { }")],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);

        TenantIdentityBoundaryTypeSymbols symbols = TenantIdentityBoundaryTypeSymbols.Resolve(compilation);

        symbols.AnyResolved.Should().BeFalse();
    }
}
