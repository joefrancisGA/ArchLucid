using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class TenantIdentityBoundaryAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Arch001Descriptor.Rule];

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

        TenantIdentityBoundaryTypeSymbols symbols = TenantIdentityBoundaryTypeSymbols.Resolve(context.Compilation);

        if (!symbols.AnyResolved)
            return;

        context.RegisterSyntaxNodeAction(c => AnalyzeIdentifierOrGeneric(c, symbols), SyntaxKind.IdentifierName);
        context.RegisterSyntaxNodeAction(c => AnalyzeIdentifierOrGeneric(c, symbols), SyntaxKind.GenericName);
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 } name)
            return false;

        return !string.Equals(name, "ArchLucid.Api", StringComparison.Ordinal) &&
               !name.StartsWith("ArchLucid.Host.", StringComparison.Ordinal);
    }

    private static void AnalyzeIdentifierOrGeneric(SyntaxNodeAnalysisContext context, TenantIdentityBoundaryTypeSymbols symbols)
    {
        if (IsInNameOf(context.Node))
            return;

        SyntaxNode node = context.Node;

        // Type parameters are surfaced via the containing generic name analysis to avoid duplicate diagnostics.
        if (node.Parent is TypeArgumentListSyntax)
            return;

        // Avoid duplicate diagnostics for `A.B.C` — only flag the rightmost bound type name.
        if (node.Parent is QualifiedNameSyntax qualified && !ReferenceEquals(qualified.Right, node))
            return;

        if (node is GenericNameSyntax genericParent &&
            node.Parent is QualifiedNameSyntax q2 &&
            !ReferenceEquals(q2.Right, genericParent))
            return;

        SemanticModel model = context.SemanticModel;

        switch (node)
        {
            case GenericNameSyntax generic:
                AnalyzeGenericName(context, symbols, model, generic);

                return;

            default:
                AnalyzeIdentifierName(context, symbols, model, (IdentifierNameSyntax)node);

                return;
        }
    }

    private static void AnalyzeGenericName(
        SyntaxNodeAnalysisContext context,
        TenantIdentityBoundaryTypeSymbols symbols,
        SemanticModel model,
        GenericNameSyntax generic)
    {
        ISymbol? symbol = model.GetSymbolInfo(generic).Symbol;

        if (symbol is not INamedTypeSymbol { IsGenericType: true } named)
            return;

        foreach (ITypeSymbol? unused in named.TypeArguments.Where(typeArg => IsOrUsesBannedType(typeArg, symbols)))
        {
            context.ReportDiagnostic(Arch001Descriptor.Create(generic.Identifier.GetLocation(), named.ToDisplayString()));
        }
    }

    private static void AnalyzeIdentifierName(
        SyntaxNodeAnalysisContext context,
        TenantIdentityBoundaryTypeSymbols symbols,
        SemanticModel model,
        IdentifierNameSyntax identifier)
    {
        ISymbol? symbol = model.GetSymbolInfo(identifier).Symbol;

        if (symbol is IAliasSymbol alias)
            symbol = alias.Target;

        switch (symbol)
        {
            case INamedTypeSymbol named:
                if (IsOrUsesBannedType(named, symbols))
                    context.ReportDiagnostic(Arch001Descriptor.Create(identifier.Identifier.GetLocation(), named.ToDisplayString()));

                return;

            case IParameterSymbol parameter:
                if (IsOrUsesBannedType(parameter.Type, symbols))
                    context.ReportDiagnostic(Arch001Descriptor.Create(identifier.Identifier.GetLocation(), parameter.Type.ToDisplayString()));

                return;

            case IPropertySymbol property:
                if (IsOrUsesBannedType(property.Type, symbols))
                    context.ReportDiagnostic(Arch001Descriptor.Create(identifier.Identifier.GetLocation(), property.Type.ToDisplayString()));

                return;

            case IFieldSymbol field:
                if (IsOrUsesBannedType(field.Type, symbols))
                    context.ReportDiagnostic(Arch001Descriptor.Create(identifier.Identifier.GetLocation(), field.Type.ToDisplayString()));

                return;

            case ILocalSymbol local:
                if (IsOrUsesBannedType(local.Type, symbols))
                    context.ReportDiagnostic(Arch001Descriptor.Create(identifier.Identifier.GetLocation(), local.Type.ToDisplayString()));

                return;
        }
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

    private static bool IsOrUsesBannedType(ITypeSymbol type, TenantIdentityBoundaryTypeSymbols symbols)
    {
        ITypeSymbol unwrapped = UnwrapNullable(type);

        if (unwrapped is not INamedTypeSymbol named)
            return false;
        if (symbols.HttpContext is not null && SymbolEqualityComparer.Default.Equals(named, symbols.HttpContext))
            return true;
        if (symbols.IHttpContextAccessor is not null && SymbolEqualityComparer.Default.Equals(named, symbols.IHttpContextAccessor))
            return true;
        if (symbols.ClaimsPrincipal is not null && SymbolEqualityComparer.Default.Equals(named, symbols.ClaimsPrincipal))
            return true;
        if (symbols.IHttpContextAccessor is null)
            return false;

        foreach (INamedTypeSymbol iface in named.AllInterfaces)
            if (SymbolEqualityComparer.Default.Equals(iface, symbols.IHttpContextAccessor))
                return true;

        return false;
    }

    private static ITypeSymbol UnwrapNullable(ITypeSymbol type)
    {
        if (type is INamedTypeSymbol { OriginalDefinition.SpecialType: SpecialType.System_Nullable_T, TypeArguments.Length: 1 } named)
            return named.TypeArguments[0];

        return type;
    }
}
