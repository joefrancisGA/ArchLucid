using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC28d package-coverage batch: SQL expression Join/binary-add resolution and compound WHERE inspection.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc28dTests
{
    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_string_join()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("string.Join(\"\", \"SELECT \", \"FROM dbo.Runs WHERE TenantId = @TenantId\")");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Runs");
        result.SqlText.Should().Contain("TenantId");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_binary_add()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT * FROM dbo.Findings \" + \"WHERE TenantId = @TenantId\"");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Findings");
        result.SqlText.Should().Contain("TenantId");
    }

    [Fact]
    public void TenantScopedQuerySqlInspector_HasCompoundWhereClause_true_and_false()
    {
        TenantScopedQuerySqlInspector
            .HasCompoundWhereClause("SELECT 1 FROM dbo.Runs WHERE TenantId = @TenantId AND ProjectId = @ProjectId")
            .Should()
            .BeTrue();

        TenantScopedQuerySqlInspector
            .HasCompoundWhereClause("SELECT 1 FROM dbo.Runs WHERE TenantId = @TenantId")
            .Should()
            .BeFalse();

        TenantScopedQuerySqlInspector
            .HasCompoundWhereClause("SELECT 1 FROM dbo.Runs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void RequireAuthorizationAnalyzer_exposes_descriptor()
    {
        RequireAuthorizationAnalyzer analyzer = new();
        analyzer.SupportedDiagnostics.Should().NotBeEmpty();
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression)
    {
        string source = "class Probe { void M() { string sql; sql = " + expression + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        CSharpCompilation compilation = CSharpCompilation.Create(
            "TenantScopedSqlExpressionResolverRc28d",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        SemanticModel model = compilation.GetSemanticModel(tree);
        AssignmentExpressionSyntax? assignment = tree.GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .FirstOrDefault();

        return TenantScopedSqlExpressionResolver.Resolve(assignment?.Right, model);
    }
}
