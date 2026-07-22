using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch3Tests
{
    [Fact]
    public async Task MutableStaticAnalyzer_flags_static_property_with_internal_setter()
    {
        const string testCode = """
namespace N;

public static class C
{
    internal static int Prop { get; set; }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutableStaticAnalyzer, DefaultVerifier>
            .Diagnostic(Arch005Descriptor.Rule)
            .WithSpan(5, 25, 5, 29)
            .WithArguments("N.C.Prop");

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { ApplicationAssemblyNameTransform },
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task MutableStaticAnalyzer_does_not_flag_private_setter_or_const()
    {
        const string testCode = """
namespace N;

public static class C
{
    public const int OkConst = 1;
    public static int Prop { get; private set; }
    public static int ExpressionBodied => 1;
}
""";

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { ApplicationAssemblyNameTransform },
        };

        await test.RunAsync();
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_interpolated_string_with_const_hole()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide(
                "$\"SELECT * FROM dbo.Runs WHERE {filterColumn}\"",
                "const string filterColumn = \"TenantId = @TenantId\";");

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains("dbo.Runs", result.SqlText);
        Assert.Contains("TenantId", result.SqlText);
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_string_concat()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("string.Concat(\"SELECT \", \"FROM dbo.Runs\")");

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains("dbo.Runs", result.SqlText);
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_null_expression_is_not_static()
    {
        SyntaxTree tree = CSharpSyntaxTree.ParseText("class Probe { void M() { } }");
        CSharpCompilation compilation = CSharpCompilation.Create(
            "TenantScopedSqlNull",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        SemanticModel model = compilation.GetSemanticModel(tree);

        TenantScopedSqlExpressionResolver.ResolutionResult result =
            TenantScopedSqlExpressionResolver.Resolve(null, model);

        Assert.False(result.IsStaticallyResolved);
        Assert.Null(result.SqlText);
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_with_scope_helper_sets_flag()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult resolved =
            ResolveRightHandSide("\"SELECT 1 FROM dbo.Runs\"");

        TenantScopedSqlExpressionResolver.ResolutionResult withHelper = resolved.WithScopeHelper(true);

        Assert.True(withHelper.HasScopeHelperInvocation);
        Assert.True(withHelper.IsStaticallyResolved);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(
        string expression,
        string preamble = "const string filterColumn = \"TenantId = @TenantId\";")
    {
        string source =
            "class Probe { void M() { "
            + preamble
            + " string sql; sql = "
            + expression
            + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        CSharpCompilation compilation = CSharpCompilation.Create(
            "TenantScopedSqlExpressionResolverBatch3",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        SemanticModel model = compilation.GetSemanticModel(tree);
        AssignmentExpressionSyntax? assignment = tree.GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .FirstOrDefault(node => node.IsKind(SyntaxKind.SimpleAssignmentExpression));

        return TenantScopedSqlExpressionResolver.Resolve(assignment?.Right, model);
    }

    private static Solution ApplicationAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");
}
