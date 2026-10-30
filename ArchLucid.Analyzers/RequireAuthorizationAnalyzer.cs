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
        INamedTypeSymbol? nonActionAttribute =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.NonActionAttribute");

        if (authorizeAttribute is null && allowAnonymousAttribute is null)
            return;

        context.RegisterSymbolAction(
            c => AnalyzeNamedType(c, controllerBase, authorizeAttribute, allowAnonymousAttribute, nonActionAttribute),
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
        INamedTypeSymbol? allowAnonymousAttribute,
        INamedTypeSymbol? nonActionAttribute)
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

        bool foundPublicApiAction = false;
        bool reportedAnyMethod = false;
        bool hasAnyDeclaredPublicMethods = false;
        bool hasUnauthorizedDeclaredApiActions = false;

        foreach (ISymbol member in symbol.GetMembers())
        {
            if (member is not IMethodSymbol method)
                continue;

            if (method.IsImplicitlyDeclared)
                continue;

            if (!IsDeclaredControllerApiMethod(method))
                continue;

            if (method.IsStatic)
                continue;

            if (method.MethodKind is not (MethodKind.Ordinary or MethodKind.ExplicitInterfaceImplementation))
                continue;

            if (method.AssociatedSymbol is not null && method.ExplicitInterfaceImplementations.IsDefaultOrEmpty)
                continue;

            hasAnyDeclaredPublicMethods = true;

            if (nonActionAttribute is not null &&
                (SymbolHasAttribute(method, nonActionAttribute) ||
                 MethodInheritsAttributeFromOverriddenChain(method, nonActionAttribute)))
                continue;

            foundPublicApiAction = true;

            if (ActionHasAuthorization(method, authorizeAttribute, allowAnonymousAttribute))
            {
                continue;
            }

            Location? location = method.Locations.FirstOrDefault();

            if (location is null)
                continue;

            if (symbol.IsAbstract)
            {
                hasUnauthorizedDeclaredApiActions = true;
                continue;
            }

            context.ReportDiagnostic(
                Al0001Descriptor.Create(location, method.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
            reportedAnyMethod = true;
        }

        if (!symbol.IsAbstract)
        {
            for (INamedTypeSymbol? baseType = symbol.BaseType;
                 baseType is not null &&
                 !SymbolIsControllerBase(baseType, controllerBase);
                 baseType = baseType.BaseType)
            {
                foreach (IMethodSymbol inheritedMethod in baseType.GetMembers().OfType<IMethodSymbol>())
                {
                    if (!IsDeclaredPublicApiAction(inheritedMethod, nonActionAttribute))
                    {
                        continue;
                    }

                    foundPublicApiAction = true;

                    if (InheritedPublicApiActionHasAuthorization(
                            inheritedMethod,
                            authorizeAttribute,
                            allowAnonymousAttribute))
                    {
                        continue;
                    }

                    Location? location = symbol.Locations.FirstOrDefault();

                    if (location is null)
                    {
                        continue;
                    }

                    context.ReportDiagnostic(
                        Al0001Descriptor.Create(
                            location,
                            inheritedMethod.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
                    reportedAnyMethod = true;
                }
            }
        }

        if (reportedAnyMethod)
            return;

        if (foundPublicApiAction && !symbol.IsAbstract)
            return;

        if (!hasAnyDeclaredPublicMethods)
        {
            // An abstract controller with no members of its own still inherits actions. The empty-type
            // diagnostic is for controllers that do not already expose an authorized inherited action.

            if (symbol.IsAbstract &&
                InheritedPublicApiActionsAreAllAuthorized(
                    symbol,
                    controllerBase,
                    authorizeAttribute,
                    allowAnonymousAttribute,
                    nonActionAttribute))
            {
                return;
            }

            if (!symbol.IsAbstract &&
                DefaultInterfacePublicApiActionsAreAllAuthorized(
                    symbol,
                    authorizeAttribute,
                    allowAnonymousAttribute,
                    nonActionAttribute))
            {
                return;
            }

            // Non-public and [NonAction] route-marked members are not API actions; do not emit a
            // type-level AL0001 when the controller exposes no public actions (e.g. protected helpers).

            if (!symbol.IsAbstract &&
                !foundPublicApiAction &&
                (SymbolHasNonPublicRouteAttributedMember(symbol, nonActionAttribute) ||
                 SymbolHasNonActionRouteMarkedPublicMember(symbol, nonActionAttribute) ||
                 NestedDerivedControllerTypesSatisfyEmptyOuterShell(
                     symbol,
                     controllerBase,
                     authorizeAttribute,
                     allowAnonymousAttribute,
                     nonActionAttribute)))
            {
                return;
            }

            Location? typeLocation = symbol.Locations.FirstOrDefault();

            if (typeLocation is null)
                return;

            context.ReportDiagnostic(
                Al0001Descriptor.Create(typeLocation, symbol.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
            return;
        }

        if (symbol.IsAbstract && hasUnauthorizedDeclaredApiActions)
        {
            Location? typeLocation = symbol.Locations.FirstOrDefault();

            if (typeLocation is null)
                return;

            context.ReportDiagnostic(
                Al0001Descriptor.Create(typeLocation, symbol.ToDisplayString(SymbolDisplayFormat.CSharpShortErrorMessageFormat)));
        }
    }

    private static bool InheritedPublicApiActionsAreAllAuthorized(
        INamedTypeSymbol symbol,
        INamedTypeSymbol controllerBase,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute,
        INamedTypeSymbol? nonActionAttribute)
    {
        bool foundInheritedApiAction = false;

        for (INamedTypeSymbol? baseType = symbol.BaseType;
             baseType is not null && !SymbolIsControllerBase(baseType, controllerBase);
             baseType = baseType.BaseType)
        {
            foreach (IMethodSymbol inheritedMethod in baseType.GetMembers().OfType<IMethodSymbol>())
            {
                if (!IsDeclaredPublicApiAction(inheritedMethod, nonActionAttribute))
                {
                    continue;
                }

                foundInheritedApiAction = true;

                if (!InheritedPublicApiActionHasAuthorization(
                        inheritedMethod,
                        authorizeAttribute,
                        allowAnonymousAttribute))
                {
                    return false;
                }
            }
        }

        return foundInheritedApiAction;
    }

    private static bool DefaultInterfacePublicApiActionsAreAllAuthorized(
        INamedTypeSymbol controllerType,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute,
        INamedTypeSymbol? nonActionAttribute)
    {
        bool foundDefaultInterfaceApiAction = false;

        foreach (INamedTypeSymbol iface in controllerType.AllInterfaces)
        {
            foreach (ISymbol member in iface.GetMembers())
            {
                if (member is not IMethodSymbol interfaceMethod ||
                    interfaceMethod.MethodKind != MethodKind.Ordinary ||
                    interfaceMethod.IsAbstract ||
                    interfaceMethod.IsStatic)
                {
                    continue;
                }

                IMethodSymbol? implementation =
                    controllerType.FindImplementationForInterfaceMember(interfaceMethod) as IMethodSymbol;

                if (implementation is null ||
                    !SymbolEqualityComparer.Default.Equals(implementation, interfaceMethod))
                {
                    continue;
                }

                if (!IsDeclaredPublicApiAction(interfaceMethod, nonActionAttribute))
                {
                    continue;
                }

                if (!MethodHasAspNetCoreActionMarkerAttribute(interfaceMethod))
                {
                    continue;
                }

                foundDefaultInterfaceApiAction = true;

                if (!ActionHasAuthorization(interfaceMethod, authorizeAttribute, allowAnonymousAttribute))
                {
                    return false;
                }
            }
        }

        return foundDefaultInterfaceApiAction;
    }

    private static bool NestedDerivedControllerTypesSatisfyEmptyOuterShell(
        INamedTypeSymbol outerController,
        INamedTypeSymbol controllerBase,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute,
        INamedTypeSymbol? nonActionAttribute)
    {
        bool foundNestedController = false;

        foreach (ISymbol member in outerController.GetMembers())
        {
            if (member is not INamedTypeSymbol nestedType || nestedType.TypeKind != TypeKind.Class)
                continue;

            if (!InheritsFromControllerBase(nestedType, controllerBase))
                continue;

            foundNestedController = true;

            if (HasTypeLevelAuthorizeOrAllowAnonymous(
                    nestedType,
                    controllerBase,
                    authorizeAttribute,
                    allowAnonymousAttribute))
            {
                continue;
            }

            bool hasPublicApiAction = false;

            foreach (IMethodSymbol method in nestedType.GetMembers().OfType<IMethodSymbol>())
            {
                if (!IsDeclaredPublicApiAction(method, nonActionAttribute))
                    continue;

                hasPublicApiAction = true;

                if (!ActionHasAuthorization(method, authorizeAttribute, allowAnonymousAttribute))
                    return false;
            }

            if (!hasPublicApiAction)
                return false;
        }

        return foundNestedController;
    }

    private static bool IsDeclaredControllerApiMethod(IMethodSymbol method)
    {
        if (method.MethodKind == MethodKind.ExplicitInterfaceImplementation)
            return true;

        return method.DeclaredAccessibility == Accessibility.Public;
    }

    private static bool IsDeclaredPublicApiAction(IMethodSymbol method, INamedTypeSymbol? nonActionAttribute)
    {
        if (method.IsStatic)
        {
            return false;
        }

        if (method.AssociatedSymbol is not null && method.ExplicitInterfaceImplementations.IsDefaultOrEmpty)
        {
            return false;
        }

        if (method.MethodKind == MethodKind.ExplicitInterfaceImplementation)
        {
            // Explicit interface actions are inherited like public API actions.
        }
        else if (method.MethodKind != MethodKind.Ordinary || method.DeclaredAccessibility != Accessibility.Public)
        {
            return false;
        }

        if (nonActionAttribute is not null &&
            (SymbolHasAttribute(method, nonActionAttribute) ||
             MethodInheritsAttributeFromOverriddenChain(method, nonActionAttribute)))
        {
            return false;
        }

        return true;
    }

    private static bool ActionHasAuthorization(
        IMethodSymbol method,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        if (SymbolHasAuthorizeOrAllowAnonymous(method, authorizeAttribute, allowAnonymousAttribute))
        {
            return true;
        }

        if (MethodInheritsAuthorizeOrAllowAnonymousFromOverriddenChain(method, authorizeAttribute, allowAnonymousAttribute))
        {
            return true;
        }

        return MethodInheritsAuthorizeOrAllowAnonymousFromInterfaces(method, authorizeAttribute, allowAnonymousAttribute);
    }

    private static bool InheritedPublicApiActionHasAuthorization(
        IMethodSymbol inheritedMethod,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        if (inheritedMethod.MethodKind == MethodKind.ExplicitInterfaceImplementation)
        {
            return ExplicitInterfaceImplementationHasAuthorization(
                inheritedMethod,
                authorizeAttribute,
                allowAnonymousAttribute);
        }

        return ActionHasAuthorization(inheritedMethod, authorizeAttribute, allowAnonymousAttribute);
    }

    private static bool ExplicitInterfaceImplementationHasAuthorization(
        IMethodSymbol method,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        if (SymbolHasAuthorizeOrAllowAnonymous(method, authorizeAttribute, allowAnonymousAttribute))
        {
            return true;
        }

        if (MethodInheritsAuthorizeOrAllowAnonymousFromOverriddenChain(method, authorizeAttribute, allowAnonymousAttribute))
        {
            return true;
        }

        foreach (IMethodSymbol interfaceMethod in method.ExplicitInterfaceImplementations)
        {
            if (SymbolHasAuthorizeOrAllowAnonymous(interfaceMethod, authorizeAttribute, allowAnonymousAttribute))
            {
                return true;
            }

            INamedTypeSymbol iface = interfaceMethod.ContainingType;

            if (SymbolHasAuthorizeOrAllowAnonymous(iface, authorizeAttribute, allowAnonymousAttribute))
            {
                return true;
            }
        }

        return false;
    }

    private static bool InheritsFromControllerBase(INamedTypeSymbol type, INamedTypeSymbol controllerBase)
    {
        for (INamedTypeSymbol? current = type.BaseType; current is not null; current = current.BaseType)
        {
            if (SymbolIsControllerBase(current, controllerBase))
                return true;
        }

        return false;
    }

    private static bool SymbolIsControllerBase(INamedTypeSymbol type, INamedTypeSymbol controllerBase)
    {
        if (SymbolEqualityComparer.Default.Equals(type, controllerBase))
            return true;

        if (!string.Equals(type.MetadataName, controllerBase.MetadataName, StringComparison.Ordinal))
            return false;

        INamespaceSymbol? typeNamespace = type.ContainingNamespace;
        INamespaceSymbol? controllerNamespace = controllerBase.ContainingNamespace;

        if (typeNamespace is null || controllerNamespace is null)
            return false;

        return string.Equals(
            typeNamespace.ToDisplayString(),
            controllerNamespace.ToDisplayString(),
            StringComparison.Ordinal);
    }

    private static bool HasTypeLevelAuthorizeOrAllowAnonymous(
        INamedTypeSymbol type,
        INamedTypeSymbol controllerBase,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        for (INamedTypeSymbol? current = type; current is not null; current = current.BaseType)
        {
            if (SymbolIsControllerBase(current, controllerBase))
                break;

            if (SymbolHasAuthorizeOrAllowAnonymous(current, authorizeAttribute, allowAnonymousAttribute))
                return true;
        }

        return false;
    }

    private static bool MethodInheritsAuthorizeOrAllowAnonymousFromInterfaces(
        IMethodSymbol method,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        foreach (IMethodSymbol explicitImplementation in method.ExplicitInterfaceImplementations)
        {
            if (SymbolHasAuthorizeOrAllowAnonymous(explicitImplementation, authorizeAttribute, allowAnonymousAttribute))
                return true;
        }

        INamedTypeSymbol containingType = method.ContainingType;

        foreach (INamedTypeSymbol iface in containingType.AllInterfaces)
        {
            foreach (ISymbol member in iface.GetMembers())
            {
                if (member is not IMethodSymbol interfaceMethod)
                    continue;

                if (interfaceMethod.MethodKind != MethodKind.Ordinary)
                    continue;

                IMethodSymbol? implementation =
                    containingType.FindImplementationForInterfaceMember(interfaceMethod) as IMethodSymbol;

                if (implementation is null || !SymbolEqualityComparer.Default.Equals(implementation, method))
                    continue;

                if (SymbolHasAuthorizeOrAllowAnonymous(iface, authorizeAttribute, allowAnonymousAttribute))
                    return true;

                if (SymbolHasAuthorizeOrAllowAnonymous(interfaceMethod, authorizeAttribute, allowAnonymousAttribute))
                    return true;
            }
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

    private static bool MethodInheritsAuthorizeOrAllowAnonymousFromOverriddenChain(
        IMethodSymbol method,
        INamedTypeSymbol? authorizeAttribute,
        INamedTypeSymbol? allowAnonymousAttribute)
    {
        for (IMethodSymbol? overridden = method.OverriddenMethod;
             overridden is not null;
             overridden = overridden.OverriddenMethod)
        {
            if (SymbolHasAuthorizeOrAllowAnonymous(overridden, authorizeAttribute, allowAnonymousAttribute))
                return true;
        }

        return false;
    }

    private static bool MethodInheritsAttributeFromOverriddenChain(
        IMethodSymbol method,
        INamedTypeSymbol attributeType)
    {
        for (IMethodSymbol? overridden = method.OverriddenMethod;
             overridden is not null;
             overridden = overridden.OverriddenMethod)
        {
            if (SymbolHasAttribute(overridden, attributeType))
                return true;
        }

        return false;
    }

    private static bool SymbolHasAttribute(ISymbol symbol, INamedTypeSymbol attributeType)
    {
        foreach (AttributeData attribute in symbol.GetAttributes())
        {
            INamedTypeSymbol? attributeClass = attribute.AttributeClass;

            if (attributeClass is not null && InheritsFromOrEqualsAttribute(attributeClass, attributeType))
                return true;
        }

        return false;
    }

    private static bool SymbolHasNonActionRouteMarkedPublicMember(
        INamedTypeSymbol symbol,
        INamedTypeSymbol? nonActionAttribute)
    {
        if (nonActionAttribute is null)
            return false;

        foreach (ISymbol member in symbol.GetMembers())
        {
            if (member is not IMethodSymbol method)
                continue;

            if (method.IsImplicitlyDeclared || method.IsStatic)
                continue;

            if (!IsDeclaredControllerApiMethod(method))
                continue;

            if (!SymbolHasAttribute(method, nonActionAttribute) &&
                !MethodInheritsAttributeFromOverriddenChain(method, nonActionAttribute))
            {
                continue;
            }

            if (MethodHasAspNetCoreActionMarkerAttribute(method))
                return true;
        }

        return false;
    }

    private static bool SymbolHasNonPublicRouteAttributedMember(
        INamedTypeSymbol symbol,
        INamedTypeSymbol? nonActionAttribute)
    {
        foreach (ISymbol member in symbol.GetMembers())
        {
            if (member is not IMethodSymbol method)
                continue;

            if (method.IsImplicitlyDeclared || method.IsStatic)
                continue;

            if (IsDeclaredControllerApiMethod(method))
                continue;

            if (nonActionAttribute is not null &&
                (SymbolHasAttribute(method, nonActionAttribute) ||
                 MethodInheritsAttributeFromOverriddenChain(method, nonActionAttribute)))
            {
                continue;
            }

            if (MethodHasAspNetCoreActionMarkerAttribute(method))
                return true;
        }

        return false;
    }

    private static bool MethodHasAspNetCoreActionMarkerAttribute(IMethodSymbol method)
    {
        foreach (AttributeData attribute in method.GetAttributes())
        {
            INamedTypeSymbol? attributeClass = attribute.AttributeClass;

            for (INamedTypeSymbol? walker = attributeClass; walker is not null; walker = walker.BaseType)
            {
                if (IsAspNetCoreActionMarkerAttributeName(walker.Name))
                    return true;
            }
        }

        return false;
    }

    private static bool IsAspNetCoreActionMarkerAttributeName(string attributeMetadataName) =>
        attributeMetadataName is "HttpGetAttribute"
            or "HttpPostAttribute"
            or "HttpPutAttribute"
            or "HttpDeleteAttribute"
            or "HttpPatchAttribute"
            or "RouteAttribute"
            or "HttpMethodAttribute"
            or "AcceptVerbsAttribute";
}
