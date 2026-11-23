using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

/// <summary>
/// Advisory flow-sensitive guard: authorization results must be checked and
/// denial must terminate the path before the sensitive read.
/// Conservative: does not claim complete interprocedural security proof.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class AuthorizationDecisionConsumptionAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "FND017003";
    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId, "Authorization result must be consumed",
        "Evidence authorization result '{0}' is not proven to deny access before resource reads",
        "Architecture", DiagnosticSeverity.Info, isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterSyntaxNodeAction(Analyze, SyntaxKind.MethodDeclaration);
    }

    private static void Analyze(SyntaxNodeAnalysisContext context)
    {
        if (context.Compilation.AssemblyName != "ArchLucid.Api" ||
            context.Node is not MethodDeclarationSyntax method ||
            method.Identifier.ValueText != "GetArchitectureGraphTemporalSnapshot" ||
            method.Body is null)
            return;

        foreach (var invocation in method.Body.DescendantNodes().OfType<InvocationExpressionSyntax>())
        {
            if (context.SemanticModel.GetSymbolInfo(invocation, context.CancellationToken).Symbol
                is not IMethodSymbol symbol ||
                symbol.Name != "AuthorizeAsync" ||
                symbol.ContainingType.Name != "EvidenceReadAuthorizationGate")
                continue;

            // Require a local assignment and a subsequent negative guard with
            // terminating return/throw in the same enclosing block. This is
            // intentionally narrower than a full control-flow graph proof.
            var statement = invocation.Ancestors().OfType<LocalDeclarationStatementSyntax>().FirstOrDefault();
            if (statement?.Parent is not BlockSyntax block)
            {
                Report(context, invocation);
                continue;
            }
            var declaration = statement.Declaration.Variables.SingleOrDefault();
            if (declaration is null || declaration.Initializer?.Value.Span.Contains(invocation.Span) != true)
            {
                Report(context, invocation);
                continue;
            }
            string variable = declaration.Identifier.ValueText;
            int position = block.Statements.IndexOf(statement);
            bool guarded = false;
            foreach (var following in block.Statements.Skip(position + 1))
            {
                if (following is not IfStatementSyntax conditional)
                    break;
                if (IsNegativeAllowedGuard(conditional.Condition, variable) &&
                    Terminates(conditional.Statement))
                {
                    guarded = true;
                    break;
                }
                // Only immediately following conditional guards count; an
                // intervening read or other statement invalidates the pattern.
            }
            if (!guarded)
                Report(context, invocation);
        }
    }

    private static bool IsNegativeAllowedGuard(ExpressionSyntax expression, string variable)
    {
        if (expression is PrefixUnaryExpressionSyntax negation &&
            negation.IsKind(SyntaxKind.LogicalNotExpression) &&
            negation.Operand is MemberAccessExpressionSyntax member &&
            member.Name.Identifier.ValueText == "Allowed" &&
            member.Expression is IdentifierNameSyntax receiver &&
            receiver.Identifier.ValueText == variable)
            return true;
        if (expression is BinaryExpressionSyntax comparison &&
            comparison.IsKind(SyntaxKind.EqualsExpression) &&
            comparison.Left is MemberAccessExpressionSyntax property &&
            property.Name.Identifier.ValueText == "Allowed" &&
            property.Expression is IdentifierNameSyntax identifier &&
            identifier.Identifier.ValueText == variable &&
            comparison.Right.IsKind(SyntaxKind.FalseLiteralExpression))
            return true;
        return false;
    }

    private static bool Terminates(StatementSyntax statement)
    {
        if (statement is ReturnStatementSyntax or ThrowStatementSyntax)
            return true;
        return statement is BlockSyntax block &&
            block.Statements.LastOrDefault() is ReturnStatementSyntax or ThrowStatementSyntax;
    }

    private static void Report(SyntaxNodeAnalysisContext context, InvocationExpressionSyntax invocation) =>
        context.ReportDiagnostic(Diagnostic.Create(Rule, invocation.GetLocation(),
            invocation.Expression.ToString()));
}
