using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

/// <summary>RC29 package-coverage batch: SQL resolver concat/scope branches and analyzer descriptor coverage.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalyzersPackageCoverageBatchRc29Tests
{
    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_binary_add_of_literals()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT RunId FROM \" + \"dbo.Runs WHERE TenantId = @TenantId\"");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Runs");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_const_local_identifier()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide(
                "filterColumn",
                "const string filterColumn = \"SELECT ArtifactId FROM dbo.Artifacts WHERE TenantId = @TenantId\";");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Artifacts");
    }

    [Theory]
    [InlineData(typeof(RequireAuthorizationAnalyzer), "AL0001")]
    [InlineData(typeof(MutatingControllerAuditAnalyzer), "AL0003")]
    [InlineData(typeof(TenantScopedQueryScopeBindingAnalyzer), "ARCH006")]
    public void Analyzer_supported_diagnostics_expose_rule_ids(Type analyzerType, string expectedRuleId)
    {
        DiagnosticAnalyzer analyzer = (DiagnosticAnalyzer)Activator.CreateInstance(analyzerType)!;

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == expectedRuleId);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(
        string expression,
        string preamble = "")
    {
        string source = "class Probe { void M() { "
            + preamble
            + " string sql; sql = "
            + expression
            + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        SemanticModel model = CreateCompilation(tree).GetSemanticModel(tree);
        AssignmentExpressionSyntax assignment = tree
            .GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .First();

        return TenantScopedSqlExpressionResolver.Resolve(assignment.Right, model);
    }

    private static Compilation CreateCompilation(SyntaxTree tree)
    {
        return CSharpCompilation.Create(
            "TenantScopedSqlExpressionResolverTests",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    }
}
