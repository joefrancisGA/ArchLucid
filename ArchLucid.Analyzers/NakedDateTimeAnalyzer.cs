using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class NakedDateTimeAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Arch002Descriptor.Rule];

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

        context.RegisterSyntaxNodeAction(AnalyzeMemberAccess, SyntaxKind.SimpleMemberAccessExpression);
        context.RegisterSyntaxNodeAction(AnalyzeIdentifier, SyntaxKind.IdentifierName);
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 } name)
            return false;

        if (string.Equals(name, "ArchLucid.Analyzers", StringComparison.Ordinal))
            return false;

        if (name.StartsWith("ArchLucid.Host.", StringComparison.Ordinal))
            return false;

        if (name.StartsWith("ArchLucid.", StringComparison.Ordinal) && name.Contains("Clock", StringComparison.Ordinal))
            return false;

        return true;
    }

    private static void AnalyzeMemberAccess(SyntaxNodeAnalysisContext context)
    {
        if (IsInNameOf(context.Node))
            return;

        SyntaxNode node = context.Node;

        if (node is not MemberAccessExpressionSyntax access)
            return;

        ISymbol? symbol = context.SemanticModel.GetSymbolInfo(access).Symbol;

        if (symbol is IPropertySymbol prop && IsBannedWallClockProperty(prop, context.Compilation))
            context.ReportDiagnostic(Arch002Descriptor.Create(access.Name.GetLocation(), prop.ToDisplayString()));
    }

    private static void AnalyzeIdentifier(SyntaxNodeAnalysisContext context)
    {
        if (IsInNameOf(context.Node))
            return;

        if (context.Node is not IdentifierNameSyntax identifier)
            return;

        if (identifier.Parent is MemberAccessExpressionSyntax member &&
            ReferenceEquals(member.Name, identifier))
            return;

        ISymbol? symbol = context.SemanticModel.GetSymbolInfo(identifier).Symbol;

        if (symbol is IPropertySymbol prop && IsBannedWallClockProperty(prop, context.Compilation))
            context.ReportDiagnostic(Arch002Descriptor.Create(identifier.Identifier.GetLocation(), prop.ToDisplayString()));
    }

    private static bool IsBannedWallClockProperty(IPropertySymbol prop, Compilation compilation)
    {
        if (prop.Name is not ("UtcNow" or "Now"))
            return false;

        INamedTypeSymbol? containing = prop.ContainingType;

        if (containing is null)
            return false;

        INamedTypeSymbol? systemDateTime = compilation.GetSpecialType(SpecialType.System_DateTime);

        if (SymbolEqualityComparer.Default.Equals(containing, systemDateTime))
            return true;

        INamedTypeSymbol? dto = compilation.GetTypeByMetadataName("System.DateTimeOffset");

        return dto is not null && SymbolEqualityComparer.Default.Equals(containing, dto);
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
