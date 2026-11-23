using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

/// <summary>
/// Advisory semantic binding check for the two SecureNow temporal snapshot gates.
/// Checks explicit tenant/project/run argument identities at known call sites.
/// Not a general taint analysis or authorization correctness proof.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class SnapshotAuthorizationResourceBindingAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "FND017005";
    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId, "Evidence gate must bind the accessed resource",
        "Evidence gate argument '{0}' must bind to '{1}'",
        "Architecture", DiagnosticSeverity.Info, isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterSyntaxNodeAction(AnalyzeMethod, SyntaxKind.MethodDeclaration);
    }

    private static void AnalyzeMethod(SyntaxNodeAnalysisContext context)
    {
        if (context.Compilation.AssemblyName != "ArchLucid.Api" ||
            context.Node is not MethodDeclarationSyntax method ||
            method.Identifier.ValueText != "GetArchitectureGraphTemporalSnapshot" ||
            method.Body is null)
            return;

        var gates = method.Body.DescendantNodes().OfType<InvocationExpressionSyntax>()
            .Where(call => context.SemanticModel.GetSymbolInfo(call, context.CancellationToken).Symbol
                is IMethodSymbol symbol && symbol.Name == "AuthorizeAsync" &&
                symbol.ContainingType.Name == "EvidenceReadAuthorizationGate")
            .OrderBy(call => call.SpanStart).ToArray();

        // This endpoint requires two distinct gate calls: anchor and resolved run.
        // Missing gates are diagnosed by FND017002/FND017004; report here too
        // rather than accidentally accepting a single correctly bound call.
        if (gates.Length != 2)
        {
            context.ReportDiagnostic(Diagnostic.Create(Rule, method.Identifier.GetLocation(),
                "gate count", "exactly two resource-specific authorization calls"));
            return;
        }

        var expected = new[]
        {
            new[] { "User", "scope.TenantId", "scope.WorkspaceId",
                    "scope.ProjectId", "runId", "ct" },
            new[] { "User", "scope.TenantId", "scope.WorkspaceId",
                    "scope.ProjectId", "resolved.RunId", "ct" }
        };

        for (int index = 0; index < gates.Length; index++)
        {
            var arguments = gates[index].ArgumentList.Arguments;
            if (arguments.Count != expected[index].Length)
            {
                context.ReportDiagnostic(Diagnostic.Create(Rule, gates[index].GetLocation(),
                    "argument count", "six explicitly bound arguments"));
                continue;
            }
            for (int i = 0; i < arguments.Count; i++)
            {
                // Compare syntax after removing harmless parentheses. Reject
                // aliases and computed expressions until dataflow establishes equivalence.
                string actual = Normalize(arguments[i].Expression);
                if (actual != expected[index][i] || arguments[i].NameColon is not null)
                    context.ReportDiagnostic(Diagnostic.Create(Rule,
                        arguments[i].GetLocation(), actual, expected[index][i]));
            }
        }
    }

    private static string Normalize(ExpressionSyntax expression)
    {
        while (expression is ParenthesizedExpressionSyntax parentheses)
            expression = parentheses.Expression;
        return expression.WithoutTrivia().ToFullString();
    }
}
