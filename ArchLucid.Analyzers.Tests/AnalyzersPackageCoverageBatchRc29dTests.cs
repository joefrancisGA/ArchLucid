using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

namespace ArchLucid.Analyzers.Tests;

/// <summary>RC29d package-coverage batch: additional analyzer descriptors and SQL resolver branches.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalyzersPackageCoverageBatchRc29dTests
{
    [Theory]
    [InlineData(typeof(MutatingControllerAuditAnalyzer), "AL0003")]
    [InlineData(typeof(TenantIdentityBoundaryAnalyzer), "ARCH001")]
    [InlineData(typeof(TenantScopedQueryScopeBindingAnalyzer), "ARCH006")]
    public void Analyzer_supported_diagnostics_expose_expected_rule_ids(Type analyzerType, string expectedRuleId)
    {
        DiagnosticAnalyzer analyzer = (DiagnosticAnalyzer)Activator.CreateInstance(analyzerType)!;

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == expectedRuleId);
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_run_child_scope_where_clause_marker()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("RunChildRunScopeSql.RunChildScopeWhereClause");

        result.IsStaticallyResolved.Should().BeTrue();
        result.HasScopeHelperInvocation.Should().BeTrue();
        result.SqlText.Should().Contain("TenantId = @TenantId");
        result.SqlText.Should().Contain("ScopeProjectId = @ScopeProjectId");
    }

    [Fact]
    public void TenantScopedQuerySqlInspector_recognizes_repository_scope_predicate_markers()
    {
        TenantScopedQuerySqlInspector.HasTenantIdScopePredicate(
            "SELECT r.RunId FROM dbo.Runs r WHERE r.TenantId = @TenantId").Should().BeTrue();

        TenantScopedQuerySqlInspector.HasRecognizedScopeHelperMarkers(
            "INNER JOIN dbo.Runs run_scope ON 1=1").Should().BeTrue();

        TenantScopedQuerySqlInspector.HasTripleScopePredicate(
            "TenantId = @ScopeTenantId AND WorkspaceId = @ScopeWorkspaceId AND ScopeProjectId = @ScopeProjectId")
            .Should().BeTrue();
    }

    [Fact]
    public void Arch004_and_arch005_descriptor_factories_create_rule_ids()
    {
        Location location = Location.Create(
            "probe.cs",
            new TextSpan(0, 1),
            new LinePositionSpan(new LinePosition(0, 0), new LinePosition(0, 1)));

        Arch004Descriptor.Create(location).Id.Should().Be("ARCH004");
        Arch005Descriptor.Create(location, "dbo.Runs").Id.Should().Be("ARCH005");
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression)
    {
        string source = "class Probe { void M() { string sql; sql = " + expression + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        SemanticModel model = CreateCompilation(tree).GetSemanticModel(tree);
        AssignmentExpressionSyntax assignment = tree
            .GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .First();

        return TenantScopedSqlExpressionResolver.Resolve(assignment.Right, model);
    }

    private static CSharpCompilation CreateCompilation(SyntaxTree tree) =>
        CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc29d",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
}
