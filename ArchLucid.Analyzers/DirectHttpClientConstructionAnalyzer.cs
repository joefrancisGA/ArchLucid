using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class DirectHttpClientConstructionAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Arch004Descriptor.Rule];

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext context)
    {
        if (!ShouldAnalyzeAssembly(context.Compilation.AssemblyName))
            return;

        context.RegisterSyntaxNodeAction(AnalyzeCreation, SyntaxKind.ObjectCreationExpression);
        context.RegisterSyntaxNodeAction(AnalyzeCreation, SyntaxKind.ImplicitObjectCreationExpression);
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 } name)
            return false;

        if (string.Equals(name, "ArchLucid.Analyzers", StringComparison.Ordinal))
            return false;

        if (name.EndsWith(".Tests", StringComparison.Ordinal))
            return false;

        return true;
    }

    private static void AnalyzeCreation(SyntaxNodeAnalysisContext context)
    {
        if (IsInNameOf(context.Node))
            return;

        if (IsAllowListedContainingType(context.Node, context.SemanticModel))
            return;

        ITypeSymbol? type = context.SemanticModel.GetTypeInfo(context.Node).Type;

        if (type is not INamedTypeSymbol named)
            return;

        INamedTypeSymbol? httpClient = context.SemanticModel.Compilation.GetTypeByMetadataName("System.Net.Http.HttpClient");

        if (httpClient is null || !SymbolEqualityComparer.Default.Equals(named, httpClient))
            return;

        context.ReportDiagnostic(Arch004Descriptor.Create(context.Node.GetLocation()));
    }

    private static bool IsAllowListedContainingType(SyntaxNode node, SemanticModel model)
    {
        for (SyntaxNode? current = node; current is not null; current = current.Parent)
        {
            if (current is BaseTypeDeclarationSyntax typeDecl)
            {
                ISymbol? symbol = model.GetDeclaredSymbol(typeDecl);

                if (symbol is INamedTypeSymbol named &&
                    named.Name.Contains("HttpClientFactory", StringComparison.Ordinal))
                    return true;
            }
        }

        return false;
    }

    private static bool IsInNameOf(SyntaxNode node)
    {
        SyntaxNode? current = node;

        while (current is not null)
        {
            if (current is InvocationExpressionSyntax { Expression: IdentifierNameSyntax id } &&
                string.Equals(id.Identifier.Text, "nameof", StringComparison.Ordinal))
                return true;

            current = current.Parent;
        }

        return false;
    }
}
