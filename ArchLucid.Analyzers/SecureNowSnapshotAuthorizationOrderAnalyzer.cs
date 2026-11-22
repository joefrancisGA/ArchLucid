using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

/// <summary>
/// Advisory, intra-method guard for SecureNow temporal snapshot read ordering.
/// This is a scoped syntactic/semantic check, not interprocedural control-flow proof.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class SecureNowSnapshotAuthorizationOrderAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "FND017002";
    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId, "SecureNow snapshot authorization ordering",
        "SecureNow snapshot read '{0}' lacks a preceding evidence authorization gate",
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
        if (context.Node is not MethodDeclarationSyntax method ||
            method.Identifier.ValueText != "GetArchitectureGraphTemporalSnapshot" ||
            method.Body is null ||
            context.Compilation.AssemblyName != "ArchLucid.Api")
            return;

        // In exchange-only mode the gates intentionally do not dominate ordinary
        // graph reads. A recognized pair of guarded exchange checks is reviewed
        // by the mode-aware pattern; retain legacy diagnostics otherwise.
        if (SecureNowExchangeModePattern.HasTwoGuardedExchangeChecks(method))
            return;

        // We require a guard for both the anchor and resolved run. A guard
        // appearing only after a read does not satisfy this advisory rule.
        var invocations = method.Body.DescendantNodes()
            .OfType<InvocationExpressionSyntax>()
            .OrderBy(x => x.SpanStart).ToArray();
        var authorization = invocations.Where(x =>
            IsMethod(context.SemanticModel, x, "AuthorizeAsync",
                "EvidenceReadAuthorizationGate")).ToArray();
        var reads = invocations.Where(x =>
            IsMethod(context.SemanticModel, x, "GetByIdAsync", "IRunRepository") ||
            IsMethod(context.SemanticModel, x, "GetRunDetailAsync", "IAuthorityQueryService"))
            .ToArray();

        foreach (var read in reads)
        {
            int requiredGates = IsMethod(context.SemanticModel, read,
                "GetRunDetailAsync", "IAuthorityQueryService") ? 2 : 1;
            int preceding = authorization.Count(x => x.SpanStart < read.SpanStart);
            if (preceding < requiredGates)
                context.ReportDiagnostic(Diagnostic.Create(Rule, read.GetLocation(),
                    read.Expression.ToString()));
        }
    }

    private static bool IsMethod(SemanticModel model, InvocationExpressionSyntax invocation,
        string methodName, string containingTypeName)
    {
        var symbol = model.GetSymbolInfo(invocation).Symbol as IMethodSymbol;
        if (symbol is null || symbol.Name != methodName)
            return false;
        // Include interface implementations; receiver type is preferred
        // because concrete repository implementations can vary.
        if (symbol.ContainingType.Name == containingTypeName)
            return true;
        if (invocation.Expression is MemberAccessExpressionSyntax access)
        {
            var receiver = model.GetTypeInfo(access.Expression).Type;
            return receiver?.Name == containingTypeName ||
                receiver?.AllInterfaces.Any(x => x.Name == containingTypeName) == true;
        }
        return false;
    }
}
