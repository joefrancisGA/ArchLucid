using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch2Tests
{
    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_string_literal()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT RunId FROM dbo.Runs WHERE TenantId = @TenantId\"");

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains("dbo.Runs", result.SqlText);
        Assert.False(result.HasScopeHelperInvocation);
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_string_concatenation()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT * FROM dbo.Runs WHERE \" + filterColumn");

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains("dbo.Runs", result.SqlText);
    }

    [Fact]
    public void Arch006Descriptor_create_unanalyzable_sql_emits_arch006a()
    {
        Diagnostic diagnostic = Arch006Descriptor.CreateUnanalyzableSql(Location.None, "dbo.Runs");

        Assert.Equal("ARCH006a", diagnostic.Id);
        Assert.Contains("dbo.Runs", diagnostic.GetMessage());
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression)
    {
        string source =
            "class Probe { void M() { const string filterColumn = \"TenantId = @TenantId\"; string sql; sql = "
            + expression
            + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        CSharpCompilation compilation = CSharpCompilation.Create(
            "TenantScopedSqlExpressionResolverTests",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        SemanticModel model = compilation.GetSemanticModel(tree);
        AssignmentExpressionSyntax? assignment = tree.GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .FirstOrDefault(node => node.IsKind(SyntaxKind.SimpleAssignmentExpression));

        return TenantScopedSqlExpressionResolver.Resolve(assignment?.Right, model);
    }
}
