using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class RequireAuthorizationAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Al0001Descriptor.Rule];

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

        Compilation compilation = context.Compilation;
        INamedTypeSymbol? controllerBase = compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.ControllerBase");

        if (controllerBase is null)
            return;

        INamedTypeSymbol? authorizeAttribute =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Authorization.AuthorizeAttribute");
        INamedTypeSymbol? allowAnonymousAttribute =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute");

        if (authorizeAttribute is null && allowAnonymousAttribute is null)
            return;

        context.RegisterSymbolAction(
            c => AnalyzeNamedType(c, controllerBase, authorizeAttribute, allowAnonymousAttribute),
            SymbolKind.NamedType);
    }

    private static bool ShouldAnalyzeAssembly(string? assemblyName)
    {
        if (assemblyName is not { Length: > 0 })
            return false;

        if (string.Equals(assemblyName, "ArchLucid.Analyzers", StringComparison.Ordinal))
            return false;

        if (assemblyName.EndsWith(".Tests", StringComparison.Ordinal))
            return false;

        return true;
    }

    private static void AnalyzeNamedType(
        SymbolAnalysisContext context,
        INamedTypeSymbol controllerBase,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        INamedTypeSymbol symbol = (INamedTypeSymbol)context.Symbol;

        if (symbol.TypeKind != TypeKind.Class)
            return;

        if (symbol.IsStatic)
            return;

        if (SymbolEqualityComparer.Default.Equals(symbol, controllerBase))
            return;

        if (!InheritsFromControllerBase(symbol, controllerBase))
            return;

        if (HasTypeLevelAuthorizeOrAllowAnonymous(symbol, controllerBase, authorizeAttribute, allowAnonymousAttribute))
            return;

        bool reportedAnyMethod = false;

        foreach (ISymbol member in symbol.GetMembers())
        {
            if (member is not IMethodSymbol method)
                continue;

            if (method.IsImplicitlyDeclared)
                continue;

            if (method.DeclaredAccessibility != Accessibility.Public)
                continue;

            if (method.IsStatic)
                continue;

            if (method.MethodKind != MethodKind.Ordinary)
                continue;

            if (method.AssociatedSymbol is not null)
                continue;

            if (SymbolHasAuthorizeOrAllowAnonymous(method, authorizeAttribute, allowAnonymousAttribute))
                continue;

            Location? location = method.Locations.FirstOrDefault();

            if (location is null)
                continue;

            context.ReportDiagnostic(
                Al0001Descriptor.Create(location, method.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
            reportedAnyMethod = true;
        }

        if (reportedAnyMethod)
            return;

        Location? typeLocation = symbol.Locations.FirstOrDefault();

        if (typeLocation is null)
            return;

        context.ReportDiagnostic(
            Al0001Descriptor.Create(typeLocation, symbol.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
    }

    private static bool InheritsFromControllerBase(INamedTypeSymbol type, INamedTypeSymbol controllerBase)
    {
        for (INamedTypeSymbol? current = type.BaseType; current is not null; current = current.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(current, controllerBase))
                return true;
        }

        return false;
    }

    private static bool HasTypeLevelAuthorizeOrAllowAnonymous(
        INamedTypeSymbol type,
        INamedTypeSymbol controllerBase,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        for (INamedTypeSymbol? current = type; current is not null; current = current.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(current, controllerBase))
                break;

            if (SymbolHasAuthorizeOrAllowAnonymous(current, authorizeAttribute, allowAnonymousAttribute))
                return true;
        }

        return false;
    }

    private static bool SymbolHasAuthorizeOrAllowAnonymous(
        ISymbol symbol,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        foreach (AttributeData attribute in symbol.GetAttributes())
        {
            INamedTypeSymbol? attributeClass = attribute.AttributeClass;

            if (attributeClass is null)
                continue;

            if (authorizeAttribute is not null && InheritsFromOrEqualsAttribute(attributeClass, authorizeAttribute))
                return true;

            if (allowAnonymousAttribute is not null && InheritsFromOrEqualsAttribute(attributeClass, allowAnonymousAttribute))
                return true;
        }

        return false;
    }

    private static bool InheritsFromOrEqualsAttribute(INamedTypeSymbol attributeClass, INamedTypeSymbol targetAttribute)
    {
        for (INamedTypeSymbol? current = attributeClass; current is not null; current = current.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(current, targetAttribute))
                return true;
        }

        return false;
    }
}
