using System.Collections.Generic;
using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class MutatingControllerAuditAnalyzer : DiagnosticAnalyzer
{
    internal const string HttpPostAttributeShortName = "HttpPostAttribute";
    internal const string HttpPutAttributeShortName = "HttpPutAttribute";
    internal const string HttpDeleteAttributeShortName = "HttpDeleteAttribute";
    internal const string HttpPatchAttributeShortName = "HttpPatchAttribute";
    internal const string HttpMethodAttributeShortName = "HttpMethodAttribute";
    internal const string AcceptVerbsAttributeShortName = "AcceptVerbsAttribute";

    private static readonly SymbolDisplayFormat AllowlistFqTypeFormat =
        new(globalNamespaceStyle: SymbolDisplayGlobalNamespaceStyle.Omitted,
            typeQualificationStyle: SymbolDisplayTypeQualificationStyle.NameAndContainingTypesAndNamespaces);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Al0003MutatingControllerAuditDescriptor.Rule];

    public override void Initialize(AnalysisContext analysisContext)
    {
        analysisContext.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        analysisContext.EnableConcurrentExecution();
        analysisContext.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext compilationStartAnalysisContext)
    {
        Compilation compilation = compilationStartAnalysisContext.Compilation;

        if (!string.Equals(compilation.AssemblyName, "ArchLucid.Api", StringComparison.Ordinal))
            return;

        INamedTypeSymbol? controllerBaseType =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.ControllerBase");

        INamedTypeSymbol? auditInterfaceType =
            compilation.GetTypeByMetadataName("ArchLucid.Core.Audit.IAuditService");

        INamedTypeSymbol? nonActionAttributeType =
            compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Mvc.NonActionAttribute");

        INamedTypeSymbol? exclusionAttribute =
            compilation.GetTypeByMetadataName(
                "ArchLucid.Core.Audit.MutatingAuditExcludedAttribute");

        if (controllerBaseType is null || auditInterfaceType is null)
            return;

        ImmutableHashSet<string> allowFqEntries =
            MutatingControllerAuditAllowlist.ReadFqAllowlistEntries(
                compilationStartAnalysisContext.Options,
                compilationStartAnalysisContext.CancellationToken);

        compilationStartAnalysisContext.RegisterSemanticModelAction(AnalyzeSemanticModel);
        compilationStartAnalysisContext.RegisterSymbolAction(
            symbolContext =>
            {
                AnalyzeReferencedBaseActions(
                    symbolContext,
                    controllerBaseType,
                    nonActionAttributeType,
                    exclusionAttribute,
                    allowFqEntries);
                AnalyzeDefaultInterfaceMutatingActions(
                    symbolContext,
                    controllerBaseType,
                    nonActionAttributeType,
                    exclusionAttribute,
                    allowFqEntries);
            },
            SymbolKind.NamedType);
        return;

        void AnalyzeSemanticModel(SemanticModelAnalysisContext semanticModelAnalysisContext)
        {
            SemanticModel semanticModelScoped = semanticModelAnalysisContext.SemanticModel;

            Compilation compilationScoped = semanticModelScoped.Compilation;

            if (!string.Equals(compilationScoped.AssemblyName,
                    "ArchLucid.Api",
                    StringComparison.Ordinal))
            {
                return;
            }

            CancellationToken cancellationTokenScoped = semanticModelAnalysisContext.CancellationToken;
            SyntaxTree syntaxTreeScoped = semanticModelScoped.SyntaxTree;
            SyntaxNode syntaxTreeRootScoped = syntaxTreeScoped.GetRoot(cancellationTokenScoped);

            foreach (MethodDeclarationSyntax methodDeclarationScoped in syntaxTreeRootScoped.DescendantNodes()
                         .OfType<MethodDeclarationSyntax>())
            {
                if (methodDeclarationScoped.Body is null && methodDeclarationScoped.ExpressionBody is null) continue;

                IMethodSymbol? methodDeclaredSymbol =
                    semanticModelScoped.GetDeclaredSymbol(methodDeclarationScoped, cancellationTokenScoped);

                if (methodDeclaredSymbol is null ||
                    !MethodIsCandidateApiAction(methodDeclaredSymbol,
                        controllerBaseType,
                        nonActionAttributeType))
                {
                    continue;
                }

                if (!MethodSpecifiesTrackedVerb(methodDeclaredSymbol)) continue;

                if (IsShadowedVirtualMutatingAction(methodDeclaredSymbol, compilationScoped))
                    continue;

                string fqAllowlistKeyScoped = FormatAllowlistKey(methodDeclaredSymbol);

                if (allowFqEntries.Contains(fqAllowlistKeyScoped))
                    continue;

                if (MutatingAuditExcludeApplies(exclusionAttribute, methodDeclaredSymbol))
                    continue;

                if (SemanticBodiesInvokeAuditLogAsync(
                        semanticModelScoped,
                        auditInterfaceType,
                        methodDeclaredSymbol,
                        cancellationTokenScoped))
                    continue;
                Location identifierLocationScoped = methodDeclarationScoped.Identifier.GetLocation();

                semanticModelAnalysisContext.ReportDiagnostic(
                    Al0003MutatingControllerAuditDescriptor.Create(identifierLocationScoped,
                        fqAllowlistKeyScoped));
            }
        }
    }

    private static void AnalyzeDefaultInterfaceMutatingActions(
        SymbolAnalysisContext context,
        INamedTypeSymbol controllerBaseType,
        INamedTypeSymbol? nonActionAttributeType,
        INamedTypeSymbol? exclusionAttribute,
        ImmutableHashSet<string> allowFqEntries)
    {
        if (context.Symbol is not INamedTypeSymbol controllerType ||
            controllerType.TypeKind != TypeKind.Class ||
            controllerType.IsAbstract ||
            !InheritsControllerBase(controllerType, controllerBaseType))
        {
            return;
        }

        CancellationToken cancellationToken = context.CancellationToken;

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

                if (nonActionAttributeType is not null &&
                    MethodHasAttribute(interfaceMethod, nonActionAttributeType))
                {
                    continue;
                }

                if (!MethodSpecifiesTrackedVerb(interfaceMethod))
                {
                    continue;
                }

                string fqAllowlistKey = FormatDefaultInterfaceAllowlistKey(controllerType, interfaceMethod);

                if (allowFqEntries.Contains(fqAllowlistKey))
                {
                    continue;
                }

                if (MutatingAuditExcludeApplies(exclusionAttribute, interfaceMethod))
                {
                    continue;
                }

                if (ControllerTypeHasMutatingAuditExclude(exclusionAttribute, controllerType))
                {
                    continue;
                }

                if (SyntaxBodiesReferenceLogAsync(interfaceMethod, cancellationToken))
                {
                    continue;
                }

                Location? location = controllerType.Locations.FirstOrDefault();

                if (location is null)
                {
                    continue;
                }

                context.ReportDiagnostic(
                    Al0003MutatingControllerAuditDescriptor.Create(location, fqAllowlistKey));
            }
        }
    }

    private static void AnalyzeReferencedBaseActions(
        SymbolAnalysisContext context,
        INamedTypeSymbol controllerBaseType,
        INamedTypeSymbol? nonActionAttributeType,
        INamedTypeSymbol? exclusionAttribute,
        ImmutableHashSet<string> allowFqEntries)
    {
        if (context.Symbol is not INamedTypeSymbol controllerType ||
            controllerType.TypeKind != TypeKind.Class ||
            controllerType.IsAbstract ||
            !InheritsControllerBase(controllerType, controllerBaseType))
        {
            return;
        }

        for (INamedTypeSymbol? baseType = controllerType.BaseType;
             baseType is not null &&
             !SymbolEqualityComparer.Default.Equals(baseType, controllerBaseType);
             baseType = baseType.BaseType)
        {
            foreach (IMethodSymbol method in baseType.GetMembers().OfType<IMethodSymbol>())
            {
                if (method.DeclaringSyntaxReferences.Length > 0 ||
                    method.IsAbstract ||
                    !MethodIsCandidateApiAction(method, controllerBaseType, nonActionAttributeType) ||
                    !MethodSpecifiesTrackedVerb(method) ||
                    IsShadowedVirtualMutatingAction(method, context.Compilation) ||
                    MutatingAuditExcludeApplies(exclusionAttribute, method) ||
                    allowFqEntries.Contains(FormatAllowlistKey(method)))
                {
                    continue;
                }

                Location? location = controllerType.Locations.FirstOrDefault();

                if (location is null)
                {
                    continue;
                }

                context.ReportDiagnostic(
                    Al0003MutatingControllerAuditDescriptor.Create(
                        location,
                        FormatAllowlistKey(method)));
            }
        }
    }

    internal static bool MethodIsCandidateApiAction(
        IMethodSymbol methodDeclaredSymbol,
        INamedTypeSymbol controllerBaseTypeSymbolScoped,
        INamedTypeSymbol? nonActionAttributeTypeSymbolScoped)
    {
        if (methodDeclaredSymbol.IsStatic)
        {
            return false;
        }

        if (methodDeclaredSymbol.AssociatedSymbol is not null &&
            methodDeclaredSymbol.ExplicitInterfaceImplementations.IsDefaultOrEmpty)
        {
            return false;
        }

        if (methodDeclaredSymbol.MethodKind == MethodKind.ExplicitInterfaceImplementation)
        {
            // Explicit interface actions are private in metadata but still participate in audit enforcement.
        }
        else if (methodDeclaredSymbol.MethodKind != MethodKind.Ordinary ||
                 methodDeclaredSymbol.DeclaredAccessibility != Accessibility.Public)
        {
            return false;
        }

        if (!InheritsControllerBase(methodDeclaredSymbol.ContainingType, controllerBaseTypeSymbolScoped))
            return false;

        if (nonActionAttributeTypeSymbolScoped is null)
            return true;

        if (MethodHasAttribute(methodDeclaredSymbol, nonActionAttributeTypeSymbolScoped))
            return false;

        if (!MethodHasTrackedVerbAttribute(methodDeclaredSymbol))
        {
            for (IMethodSymbol? overriddenMethod = methodDeclaredSymbol.OverriddenMethod;
                 overriddenMethod is not null;
                 overriddenMethod = overriddenMethod.OverriddenMethod)
            {
                if (MethodHasAttribute(overriddenMethod, nonActionAttributeTypeSymbolScoped))
                    return false;
            }
        }

        return true;
    }

    private static bool MethodHasAttribute(IMethodSymbol method, INamedTypeSymbol attributeType) =>
        method.GetAttributes().Any(attribute =>
            SymbolEqualityComparer.Default.Equals(attribute.AttributeClass, attributeType));

    private static bool IsShadowedVirtualMutatingAction(IMethodSymbol method, Compilation compilation)
    {
        if (!method.IsVirtual || method.IsAbstract || method.IsOverride)
            return false;

        if (!MethodHasTrackedVerbAttribute(method))
            return false;

        INamedTypeSymbol containingType = method.ContainingType;

        foreach (INamedTypeSymbol candidateType in GetNamedTypesInAssembly(compilation.Assembly))
        {
            if (SymbolEqualityComparer.Default.Equals(candidateType, containingType) ||
                !TypeExtends(candidateType, containingType))
            {
                continue;
            }

            foreach (ISymbol member in candidateType.GetMembers(method.Name))
            {
                if (member is not IMethodSymbol derivedMethod || !derivedMethod.IsOverride)
                    continue;

                if (OverridesMethod(derivedMethod, method))
                    return true;
            }
        }

        return false;
    }

    private static bool OverridesMethod(IMethodSymbol derivedMethod, IMethodSymbol targetMethod)
    {
        for (IMethodSymbol? overriddenMethod = derivedMethod.OverriddenMethod;
             overriddenMethod is not null;
             overriddenMethod = overriddenMethod.OverriddenMethod)
        {
            if (SymbolEqualityComparer.Default.Equals(overriddenMethod, targetMethod))
                return true;
        }

        return false;
    }

    private static bool TypeExtends(INamedTypeSymbol derivedType, INamedTypeSymbol baseType)
    {
        for (INamedTypeSymbol? walker = derivedType.BaseType;
             walker is not null;
             walker = walker.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(walker, baseType))
                return true;
        }

        return false;
    }

    private static IEnumerable<INamedTypeSymbol> GetNamedTypesInAssembly(IAssemblySymbol assembly)
    {
        foreach (INamespaceSymbol namespaceSymbol in GetNamespaces(assembly.GlobalNamespace))
        {
            foreach (INamedTypeSymbol type in namespaceSymbol.GetTypeMembers())
            {
                foreach (INamedTypeSymbol nestedType in GetNamedTypes(type))
                    yield return nestedType;
            }
        }
    }

    private static IEnumerable<INamedTypeSymbol> GetNamedTypes(INamedTypeSymbol type)
    {
        yield return type;

        foreach (INamedTypeSymbol nestedType in type.GetTypeMembers())
        {
            foreach (INamedTypeSymbol descendantType in GetNamedTypes(nestedType))
                yield return descendantType;
        }
    }

    private static IEnumerable<INamespaceSymbol> GetNamespaces(INamespaceSymbol root)
    {
        yield return root;

        foreach (INamespaceSymbol child in root.GetNamespaceMembers())
        {
            foreach (INamespaceSymbol nested in GetNamespaces(child))
                yield return nested;
        }
    }

    private static bool InheritsControllerBase(
        INamedTypeSymbol declaringTypeSymbolScoped,
        INamedTypeSymbol controllerBaseTypeSymbolScoped)
    {
        for (INamedTypeSymbol? walkerScoped = declaringTypeSymbolScoped;
             walkerScoped is not null;
             walkerScoped = walkerScoped.BaseType)
        {
            if (SymbolEqualityComparer.Default.Equals(walkerScoped, controllerBaseTypeSymbolScoped))
                return true;
        }

        return false;
    }

    internal static string FormatAllowlistKey(IMethodSymbol methodDeclaredSymbolScoped) =>
        $"{FormatAllowlistFqType(methodDeclaredSymbolScoped.ContainingType)}.{methodDeclaredSymbolScoped.Name}";

    internal static string FormatDefaultInterfaceAllowlistKey(
        INamedTypeSymbol controllerTypeSymbolScoped,
        IMethodSymbol interfaceMethodSymbolScoped) =>
        $"{FormatAllowlistFqType(controllerTypeSymbolScoped)}.{FormatAllowlistFqType(interfaceMethodSymbolScoped.ContainingType)}.{interfaceMethodSymbolScoped.Name}";

    internal static string FormatAllowlistFqType(INamedTypeSymbol namedTypeSymbolScoped)
    {
        string raw = namedTypeSymbolScoped.ToDisplayString(AllowlistFqTypeFormat).Trim();

        if (raw.StartsWith("global::", StringComparison.Ordinal))
            raw = raw.Substring("global::".Length).Trim();

        return raw;
    }

    internal static IEnumerable<SyntaxNode> EnumerateMethodBodies(
        MethodDeclarationSyntax methodDeclarationSyntaxScoped)
    {
        BlockSyntax? blockSyntaxScoped = methodDeclarationSyntaxScoped.Body;

        if (blockSyntaxScoped is not null)
            yield return blockSyntaxScoped;

        ArrowExpressionClauseSyntax? arrowClauseScoped = methodDeclarationSyntaxScoped.ExpressionBody;

        if (arrowClauseScoped is null)
            yield break;

        yield return arrowClauseScoped.Expression;
    }

    private static bool IsLocalFunctionReachableFromMethodEntry(
        LocalFunctionStatementSyntax targetLocalFunctionStatementSyntax,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        ImmutableArray<LocalFunctionStatementSyntax> localFunctionsInMethod =
            containingMethodDeclarationSyntax.DescendantNodes().OfType<LocalFunctionStatementSyntax>().ToImmutableArray();

        if (localFunctionsInMethod.IsDefaultOrEmpty)
            return false;

        var reachableLocalFunctions = new HashSet<LocalFunctionStatementSyntax>();

        bool addedReachableLocalFunction;
        do
        {
            addedReachableLocalFunction = false;

            foreach (LocalFunctionStatementSyntax localFunctionStatementSyntax in localFunctionsInMethod)
            {
                if (reachableLocalFunctions.Contains(localFunctionStatementSyntax))
                    continue;

                if (!IsLocalFunctionInvokedFromReachableScope(
                        localFunctionStatementSyntax,
                        containingMethodDeclarationSyntax,
                        reachableLocalFunctions,
                        semanticModel,
                        cancellationToken))
                {
                    continue;
                }

                reachableLocalFunctions.Add(localFunctionStatementSyntax);
                addedReachableLocalFunction = true;
            }
        }
        while (addedReachableLocalFunction);

        return reachableLocalFunctions.Contains(targetLocalFunctionStatementSyntax);
    }

    private static bool IsLocalFunctionInvokedFromReachableScope(
        LocalFunctionStatementSyntax targetLocalFunctionStatementSyntax,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        HashSet<LocalFunctionStatementSyntax> reachableLocalFunctions,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        string localFunctionName = targetLocalFunctionStatementSyntax.Identifier.Text;

        foreach (InvocationExpressionSyntax invocationSyntax in containingMethodDeclarationSyntax
                     .DescendantNodes()
                     .OfType<InvocationExpressionSyntax>())
        {
            if (ReferenceEquals(
                    invocationSyntax.FirstAncestorOrSelf<LocalFunctionStatementSyntax>(),
                    targetLocalFunctionStatementSyntax))
            {
                continue;
            }

            if (!InvocationTargetsLocalFunctionName(invocationSyntax, localFunctionName))
                continue;

            LocalFunctionStatementSyntax? callerLocalFunctionStatementSyntax =
                invocationSyntax.FirstAncestorOrSelf<LocalFunctionStatementSyntax>();

            if (callerLocalFunctionStatementSyntax is null)
            {
                if (invocationSyntax.FirstAncestorOrSelf<CatchFilterClauseSyntax>() is not null)
                    continue;

                if (semanticModel is not null &&
                    !IsAuditProofSyntaxReachable(semanticModel, invocationSyntax, cancellationToken))
                {
                    continue;
                }

                return true;
            }

            if (reachableLocalFunctions.Contains(callerLocalFunctionStatementSyntax))
                return true;
        }

        return false;
    }

    private static bool InvocationTargetsLocalFunctionName(
        InvocationExpressionSyntax invocationSyntax,
        string localFunctionName)
    {
        if (invocationSyntax.Expression is IdentifierNameSyntax identifierNameSyntax &&
            identifierNameSyntax.Identifier.Text == localFunctionName)
        {
            return true;
        }

        return invocationSyntax.Expression is MemberAccessExpressionSyntax memberAccessExpressionSyntax &&
               memberAccessExpressionSyntax.Name.Identifier.Text == localFunctionName;
    }

    // Stored lambdas that are never invoked do not run on the request; count LogAsync only when the lambda is used.
    private static bool AnonymousFunctionsAroundLogAsyncSyntaxAreInvoked(
        SyntaxNode logAsyncSyntaxNode,
        MethodDeclarationSyntax containingMethodDeclarationSyntax)
    {
        foreach (SyntaxNode ancestor in logAsyncSyntaxNode.Ancestors())
        {
            if (ReferenceEquals(ancestor, containingMethodDeclarationSyntax))
                break;

            if (ancestor is not AnonymousFunctionExpressionSyntax anonymousFunction)
                continue;

            if (!AnonymousFunctionIsInvoked(anonymousFunction, containingMethodDeclarationSyntax))
                return false;
        }

        return true;
    }

    private static bool AnonymousFunctionIsInvoked(
        AnonymousFunctionExpressionSyntax anonymousFunction,
        MethodDeclarationSyntax containingMethodDeclarationSyntax)
    {
        SyntaxNode usedNode = anonymousFunction;

        while (usedNode.Parent is ParenthesizedExpressionSyntax or CastExpressionSyntax)
            usedNode = usedNode.Parent;

        SyntaxNode? useSite = usedNode.Parent;

        if (useSite is ArgumentSyntax)
            return true;

        if (useSite is InvocationExpressionSyntax invocationExpression &&
            ReferenceEquals(invocationExpression.Expression, usedNode))
        {
            return true;
        }

        if (useSite is EqualsValueClauseSyntax equalsValueClause &&
            equalsValueClause.Parent is VariableDeclaratorSyntax variableDeclarator)
        {
            return LocalNameIsInvokedOutsideAnonymousFunction(
                variableDeclarator.Identifier.Text,
                containingMethodDeclarationSyntax,
                anonymousFunction);
        }

        if (useSite is AssignmentExpressionSyntax assignmentExpression &&
            ReferenceEquals(assignmentExpression.Right, usedNode) &&
            assignmentExpression.Left is IdentifierNameSyntax assignedName)
        {
            return LocalNameIsInvokedOutsideAnonymousFunction(
                assignedName.Identifier.Text,
                containingMethodDeclarationSyntax,
                anonymousFunction);
        }

        return false;
    }

    private static bool LocalNameIsInvokedOutsideAnonymousFunction(
        string localName,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        AnonymousFunctionExpressionSyntax definingAnonymousFunction)
    {
        foreach (InvocationExpressionSyntax invocationSyntax in containingMethodDeclarationSyntax
                     .DescendantNodes()
                     .OfType<InvocationExpressionSyntax>())
        {
            if (IsInsideAnonymousFunction(invocationSyntax, definingAnonymousFunction))
                continue;

            if (invocationSyntax.Expression is IdentifierNameSyntax identifierNameSyntax &&
                identifierNameSyntax.Identifier.Text == localName)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsInsideAnonymousFunction(
        SyntaxNode node,
        AnonymousFunctionExpressionSyntax anonymousFunction)
    {
        for (SyntaxNode? current = node.Parent; current is not null; current = current.Parent)
        {
            if (ReferenceEquals(current, anonymousFunction))
                return true;
        }

        return false;
    }

    private static bool LogAsyncMemberAccessCountsForAuditProof(
        MemberAccessExpressionSyntax memberAccessExpressionSyntax,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(memberAccessExpressionSyntax.Name.Identifier.Text, "LogAsync", StringComparison.Ordinal))
            return false;

        return LogAsyncSyntaxCountsForAuditProof(
            memberAccessExpressionSyntax,
            containingMethodDeclarationSyntax,
            semanticModel,
            cancellationToken);
    }

    private static bool AuditLogAsyncInvocationCountsForAuditProof(
        InvocationExpressionSyntax invocationExpressionSyntax,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken) =>
        LogAsyncSyntaxCountsForAuditProof(
            invocationExpressionSyntax,
            containingMethodDeclarationSyntax,
            semanticModel,
            cancellationToken);

    private static bool LogAsyncSyntaxCountsForAuditProof(
        SyntaxNode logAsyncSyntaxNode,
        MethodDeclarationSyntax containingMethodDeclarationSyntax,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        LocalFunctionStatementSyntax? enclosingLocalFunction =
            logAsyncSyntaxNode.FirstAncestorOrSelf<LocalFunctionStatementSyntax>();

        if (enclosingLocalFunction is not null &&
            !IsLocalFunctionReachableFromMethodEntry(
                enclosingLocalFunction,
                containingMethodDeclarationSyntax,
                semanticModel,
                cancellationToken))
        {
            return false;
        }

        if (!AnonymousFunctionsAroundLogAsyncSyntaxAreInvoked(logAsyncSyntaxNode, containingMethodDeclarationSyntax))
            return false;

        return LogAsyncSyntaxIsOnExecutedPath(logAsyncSyntaxNode, semanticModel, cancellationToken);
    }

    // Catch filters and constant-unselected switch arms do not run, including when they sit inside a reachable local.
    private static bool LogAsyncSyntaxIsOnExecutedPath(
        SyntaxNode logAsyncSyntaxNode,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        if (logAsyncSyntaxNode.FirstAncestorOrSelf<CatchFilterClauseSyntax>() is not null)
            return false;

        return IsLogAsyncSyntaxProofReachable(semanticModel, logAsyncSyntaxNode, cancellationToken);
    }

    private static bool IsLogAsyncSyntaxProofReachable(
        SemanticModel? semanticModel,
        SyntaxNode logAsyncSyntaxNode,
        CancellationToken cancellationToken)
    {
        if (semanticModel is not null &&
            (!IsLogAsyncSyntaxInsideReachableIfBranches(logAsyncSyntaxNode, semanticModel, cancellationToken) ||
             !IsLogAsyncSyntaxInsideReachableConstantGuardLoops(logAsyncSyntaxNode, semanticModel, cancellationToken) ||
             !IsLogAsyncSyntaxInsideReachableForeachIterations(logAsyncSyntaxNode, semanticModel, cancellationToken)))
        {
            return false;
        }
        BinaryExpressionSyntax? coalesceExpressionSyntax =
            logAsyncSyntaxNode.FirstAncestorOrSelf<BinaryExpressionSyntax>(
                static binary => binary.IsKind(SyntaxKind.CoalesceExpression));

        if (coalesceExpressionSyntax is not null &&
            IsSyntaxNodeWithinExpression(logAsyncSyntaxNode, coalesceExpressionSyntax.Right) &&
            IsCoalesceLeftOperandNeverNull(coalesceExpressionSyntax.Left, semanticModel, cancellationToken))
        {
            return false;
        }

        SwitchExpressionArmSyntax? switchExpressionArmSyntax =
            logAsyncSyntaxNode.FirstAncestorOrSelf<SwitchExpressionArmSyntax>();

        if (switchExpressionArmSyntax is not null &&
            switchExpressionArmSyntax.Parent is SwitchExpressionSyntax switchExpressionSyntax &&
            semanticModel is not null &&
            !IsSwitchExpressionArmReachableForConstantDiscriminant(
                switchExpressionSyntax,
                switchExpressionArmSyntax,
                semanticModel,
                cancellationToken))
        {
            return false;
        }

        SwitchSectionSyntax? switchSectionSyntax = logAsyncSyntaxNode.FirstAncestorOrSelf<SwitchSectionSyntax>();

        if (switchSectionSyntax is null)
            return true;

        if (switchSectionSyntax.Parent is not SwitchStatementSyntax switchStatementSyntax)
            return true;

        if (semanticModel is not null)
        {
            return IsSwitchSectionReachableForConstantDiscriminant(
                switchStatementSyntax,
                switchSectionSyntax,
                semanticModel,
                cancellationToken);
        }

        return IsSwitchSectionReachableForSyntaxLiteralDiscriminant(switchStatementSyntax, switchSectionSyntax);
    }


    // Constant-false if branches and their else counterparts when the condition is constant true never run.
    private static bool IsLogAsyncSyntaxInsideReachableIfBranches(
        SyntaxNode logAsyncSyntaxNode,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        foreach (IfStatementSyntax ifStatementSyntax in logAsyncSyntaxNode.Ancestors().OfType<IfStatementSyntax>())
        {
            if (IsLogAsyncSyntaxUnderIfBranch(ifStatementSyntax.Statement, logAsyncSyntaxNode) &&
                IsBooleanConditionKnown(ifStatementSyntax.Condition, semanticModel, cancellationToken, expected: false))
            {
                return false;
            }

            if (ifStatementSyntax.Else?.Statement is SyntaxNode elseStatementSyntax &&
                IsLogAsyncSyntaxUnderIfBranch(elseStatementSyntax, logAsyncSyntaxNode) &&
                IsBooleanConditionKnown(ifStatementSyntax.Condition, semanticModel, cancellationToken, expected: true))
            {
                return false;
            }
        }

        return true;
    }

    // Zero-trip foreach over compile-time empty collections never runs the loop body; LogAsync there is not audit proof.
    private static bool IsLogAsyncSyntaxInsideReachableForeachIterations(
        SyntaxNode logAsyncSyntaxNode,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        foreach (ForEachStatementSyntax forEachStatementSyntax in logAsyncSyntaxNode.Ancestors().OfType<ForEachStatementSyntax>())
        {
            if (IsLogAsyncSyntaxUnderLoopBody(forEachStatementSyntax.Statement, logAsyncSyntaxNode) &&
                IsForeachCollectionExpressionProvablyEmpty(forEachStatementSyntax.Expression, semanticModel, cancellationToken))
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsForeachCollectionExpressionProvablyEmpty(
        ExpressionSyntax expressionSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        if (expressionSyntax is CollectionExpressionSyntax collectionExpressionSyntax)
        {
            return collectionExpressionSyntax.Elements.Count == 0;
        }

        if (expressionSyntax is ImplicitArrayCreationExpressionSyntax implicitArrayCreationExpressionSyntax)
        {
            return implicitArrayCreationExpressionSyntax.Initializer.Expressions.Count == 0;
        }

        if (expressionSyntax is ArrayCreationExpressionSyntax arrayCreationExpressionSyntax)
        {
            if (arrayCreationExpressionSyntax.Initializer is InitializerExpressionSyntax initializerExpressionSyntax &&
                initializerExpressionSyntax.Expressions.Count == 0)
            {
                return true;
            }

            if (arrayCreationExpressionSyntax.Initializer is null &&
                arrayCreationExpressionSyntax.Type is ArrayTypeSyntax arrayTypeSyntax &&
                arrayTypeSyntax.RankSpecifiers.Count == 1 &&
                arrayTypeSyntax.RankSpecifiers[0].Sizes.Count == 1 &&
                arrayTypeSyntax.RankSpecifiers[0].Sizes[0] is LiteralExpressionSyntax literalSizeSyntax &&
                semanticModel.GetConstantValue(literalSizeSyntax, cancellationToken) is { HasValue: true, Value: 0 })
            {
                return true;
            }
        }

        if (IsCompileTimeEmptySpanOrMemoryAccess(expressionSyntax, semanticModel, cancellationToken))
        {
            return true;
        }

        if (expressionSyntax is not InvocationExpressionSyntax invocationExpressionSyntax)

        {
            return false;
        }

        if (semanticModel.GetSymbolInfo(invocationExpressionSyntax, cancellationToken).Symbol is not IMethodSymbol methodSymbol)
        {
            return false;
        }

        if (!string.Equals(methodSymbol.Name, "Empty", StringComparison.Ordinal))
        {
            return false;
        }

        string? containingTypeName = methodSymbol.ContainingType?.Name;

        return string.Equals(containingTypeName, "Array", StringComparison.Ordinal) ||
               string.Equals(containingTypeName, "Enumerable", StringComparison.Ordinal) ||
               string.Equals(containingTypeName, "ImmutableArray", StringComparison.Ordinal);
    }


    private static bool IsCompileTimeEmptySpanOrMemoryAccess(
        ExpressionSyntax expressionSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        if (expressionSyntax is not MemberAccessExpressionSyntax memberAccessExpressionSyntax)
        {
            return false;
        }

        if (!string.Equals(memberAccessExpressionSyntax.Name.Identifier.Text, "Empty", StringComparison.Ordinal))
        {
            return false;
        }

        if (semanticModel.GetSymbolInfo(memberAccessExpressionSyntax, cancellationToken).Symbol?.ContainingType is INamedTypeSymbol containingType &&
            IsKnownCompileTimeEmptySpanOrMemoryType(containingType))
        {
            return true;
        }

        return TryGetSpanOrMemoryTypeName(memberAccessExpressionSyntax.Expression, out string? typeName) &&
               IsKnownCompileTimeEmptySpanOrMemoryName(typeName);
    }

    private static bool TryGetSpanOrMemoryTypeName(ExpressionSyntax expressionSyntax, out string? typeName)
    {
        typeName = null;

        switch (expressionSyntax)
        {
            case GenericNameSyntax genericNameSyntax:
                typeName = genericNameSyntax.Identifier.Text;
                return true;
            case QualifiedNameSyntax qualifiedNameSyntax when qualifiedNameSyntax.Right is GenericNameSyntax qualifiedGenericNameSyntax:
                typeName = qualifiedGenericNameSyntax.Identifier.Text;
                return true;
            default:
                return false;
        }
    }

    private static bool IsKnownCompileTimeEmptySpanOrMemoryName(string? typeName) =>
        string.Equals(typeName, "ReadOnlySpan", StringComparison.Ordinal) ||
        string.Equals(typeName, "Span", StringComparison.Ordinal) ||
        string.Equals(typeName, "Memory", StringComparison.Ordinal) ||
        string.Equals(typeName, "ReadOnlyMemory", StringComparison.Ordinal) ||
        string.Equals(typeName, "ImmutableArray", StringComparison.Ordinal);

    private static bool IsKnownCompileTimeEmptySpanOrMemoryType(INamedTypeSymbol namedTypeSymbol)
    {
        string typeName = namedTypeSymbol.Name;

        return string.Equals(typeName, "ReadOnlySpan", StringComparison.Ordinal) ||
               string.Equals(typeName, "Span", StringComparison.Ordinal) ||
               string.Equals(typeName, "Memory", StringComparison.Ordinal) ||
               string.Equals(typeName, "ReadOnlyMemory", StringComparison.Ordinal) ||
               string.Equals(typeName, "ImmutableArray", StringComparison.Ordinal);
    }
    // Zero-trip while/for loops never run their bodies; LogAsync parked there is not audit proof (parity with constant-false if).
    private static bool IsLogAsyncSyntaxInsideReachableConstantGuardLoops(
        SyntaxNode logAsyncSyntaxNode,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        foreach (WhileStatementSyntax whileStatementSyntax in logAsyncSyntaxNode.Ancestors().OfType<WhileStatementSyntax>())
        {
            if (IsLogAsyncSyntaxUnderLoopBody(whileStatementSyntax.Statement, logAsyncSyntaxNode) &&
                IsBooleanConditionKnown(whileStatementSyntax.Condition, semanticModel, cancellationToken, expected: false))
            {
                return false;
            }
        }

        foreach (ForStatementSyntax forStatementSyntax in logAsyncSyntaxNode.Ancestors().OfType<ForStatementSyntax>())
        {
            if (forStatementSyntax.Condition is not ExpressionSyntax forConditionSyntax)
            {
                continue;
            }

            if (IsLogAsyncSyntaxUnderLoopBody(forStatementSyntax.Statement, logAsyncSyntaxNode) &&
                IsBooleanConditionKnown(forConditionSyntax, semanticModel, cancellationToken, expected: false))
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsLogAsyncSyntaxUnderLoopBody(SyntaxNode loopBodyStatementSyntax, SyntaxNode logAsyncSyntaxNode) =>
        loopBodyStatementSyntax.FullSpan.Contains(logAsyncSyntaxNode.Span);
    private static bool IsLogAsyncSyntaxUnderIfBranch(SyntaxNode branchStatementSyntax, SyntaxNode logAsyncSyntaxNode) =>
        branchStatementSyntax.FullSpan.Contains(logAsyncSyntaxNode.Span);

    private static bool IsBooleanConditionKnown(
        ExpressionSyntax conditionSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken,
        bool expected)
    {
        Optional<object?> constantOptional = semanticModel.GetConstantValue(conditionSyntax, cancellationToken);

        if (!constantOptional.HasValue || constantOptional.Value is not bool boolValue)
        {
            return false;
        }

        return boolValue == expected;
    }
    private static bool IsSyntaxNodeWithinExpression(SyntaxNode descendant, ExpressionSyntax rootExpression)
    {
        foreach (SyntaxNode? ancestor in descendant.Ancestors())
        {
            if (ancestor is ExpressionSyntax expressionSyntax && ReferenceEquals(expressionSyntax, rootExpression))
                return true;
        }

        return false;
    }

    private static bool IsCoalesceLeftOperandNeverNull(
        ExpressionSyntax leftExpressionSyntax,
        SemanticModel? semanticModel,
        CancellationToken cancellationToken)
    {
        if (semanticModel is null)
            return false;

        Optional<object?> constantOptional = semanticModel.GetConstantValue(leftExpressionSyntax, cancellationToken);

        if (constantOptional.HasValue && constantOptional.Value is not null)
            return true;

        if (leftExpressionSyntax is not InvocationExpressionSyntax invocationExpressionSyntax)
            return false;

        IMethodSymbol? methodSymbol =
            semanticModel.GetSymbolInfo(invocationExpressionSyntax, cancellationToken).Symbol as IMethodSymbol;

        if (methodSymbol is null)
            return false;

        return string.Equals(methodSymbol.Name, "FromResult", StringComparison.Ordinal) &&
               string.Equals(methodSymbol.ContainingType?.Name, "Task", StringComparison.Ordinal);
    }

    private static bool IsAuditProofSyntaxReachable(
        SemanticModel semanticModel,
        SyntaxNode syntaxNode,
        CancellationToken cancellationToken) =>
        IsLogAsyncSyntaxProofReachable(semanticModel, syntaxNode, cancellationToken);

    private static bool IsSwitchExpressionArmReachableForConstantDiscriminant(
        SwitchExpressionSyntax switchExpressionSyntax,
        SwitchExpressionArmSyntax targetArmSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        Optional<object?> discriminantOptional =
            semanticModel.GetConstantValue(switchExpressionSyntax.GoverningExpression, cancellationToken);

        if (!discriminantOptional.HasValue)
        {
            return true;
        }

        object? discriminant = discriminantOptional.Value;

        foreach (SwitchExpressionArmSyntax armSyntax in switchExpressionSyntax.Arms)
        {
            if (ReferenceEquals(armSyntax, targetArmSyntax))
            {
                return DoesSwitchExpressionArmMatchConstantDiscriminant(
                    armSyntax,
                    discriminant,
                    semanticModel,
                    cancellationToken);
            }

            if (DoesSwitchExpressionArmMatchConstantDiscriminant(
                    armSyntax,
                    discriminant,
                    semanticModel,
                    cancellationToken))
            {
                return false;
            }
        }

        return true;
    }

    private static bool DoesSwitchExpressionArmMatchConstantDiscriminant(
        SwitchExpressionArmSyntax armSyntax,
        object? discriminant,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        if (armSyntax.Pattern is DiscardPatternSyntax)
        {
            if (armSyntax.WhenClause?.Condition is ExpressionSyntax discardWhenConditionSyntax &&
                IsBooleanConditionKnown(discardWhenConditionSyntax, semanticModel, cancellationToken, expected: false))
            {
                return false;
            }

            return true;
        }

        if (armSyntax.Pattern is ConstantPatternSyntax constantPatternSyntax)
        {
            Optional<object?> patternConstantOptional =
                semanticModel.GetConstantValue(constantPatternSyntax.Expression, cancellationToken);

            if (!patternConstantOptional.HasValue ||
                !AuditProofConstantValuesEqual(discriminant, patternConstantOptional.Value))
            {
                return false;
            }

            if (armSyntax.WhenClause?.Condition is ExpressionSyntax constantWhenConditionSyntax &&
                IsBooleanConditionKnown(constantWhenConditionSyntax, semanticModel, cancellationToken, expected: false))
            {
                return false;
            }

            return true;
        }

        return true;
    }
    private static bool IsSwitchSectionReachableForSyntaxLiteralDiscriminant(
        SwitchStatementSyntax switchStatementSyntax,
        SwitchSectionSyntax switchSectionSyntax)
    {
        if (switchStatementSyntax.Expression is not LiteralExpressionSyntax discriminantLiteralSyntax)
            return true;

        if (!TryGetSwitchLiteralValue(discriminantLiteralSyntax, out string? discriminantText))
            return true;

        bool sectionHasDefaultLabel = switchSectionSyntax.Labels.Any(
            label => label.Keyword.IsKind(SyntaxKind.DefaultKeyword));

        foreach (SwitchLabelSyntax labelSyntax in switchSectionSyntax.Labels)
        {
            if (labelSyntax is not CaseSwitchLabelSyntax caseSwitchLabelSyntax)
                continue;

            if (caseSwitchLabelSyntax.Value is LiteralExpressionSyntax caseLiteralSyntax &&
                TryGetSwitchLiteralValue(caseLiteralSyntax, out string? caseText) &&
                string.Equals(discriminantText, caseText, StringComparison.Ordinal))
            {
                return true;
            }
        }

        if (!sectionHasDefaultLabel)
            return false;

        foreach (SwitchSectionSyntax otherSectionSyntax in switchStatementSyntax.Sections)
        {
            foreach (SwitchLabelSyntax otherLabelSyntax in otherSectionSyntax.Labels)
            {
                if (otherLabelSyntax is not CaseSwitchLabelSyntax otherCaseLabelSyntax)
                    continue;

                if (otherCaseLabelSyntax.Value is LiteralExpressionSyntax otherCaseLiteralSyntax &&
                    TryGetSwitchLiteralValue(otherCaseLiteralSyntax, out string? otherCaseText) &&
                    string.Equals(discriminantText, otherCaseText, StringComparison.Ordinal))
                {
                    return false;
                }
            }
        }

        return true;
    }

    private static bool TryGetSwitchLiteralValue(LiteralExpressionSyntax literalExpressionSyntax, out string? normalizedText)
    {
        normalizedText = literalExpressionSyntax.Token.ValueText;

        if (string.IsNullOrEmpty(normalizedText))
        {
            normalizedText = literalExpressionSyntax.Token.Text;
        }

        return !string.IsNullOrEmpty(normalizedText);
    }

    private static bool IsSwitchSectionReachableForConstantDiscriminant(
        SwitchStatementSyntax switchStatementSyntax,
        SwitchSectionSyntax switchSectionSyntax,
        SemanticModel semanticModel,
        CancellationToken cancellationToken)
    {
        Optional<object?> discriminantOptional =
            semanticModel.GetConstantValue(switchStatementSyntax.Expression, cancellationToken);

        if (!discriminantOptional.HasValue)
            return true;

        object? discriminant = discriminantOptional.Value;
        bool sectionHasDefaultLabel = switchSectionSyntax.Labels.Any(
            label => label.Keyword.IsKind(SyntaxKind.DefaultKeyword));

        foreach (SwitchLabelSyntax labelSyntax in switchSectionSyntax.Labels)
        {
            if (labelSyntax is not CaseSwitchLabelSyntax caseSwitchLabelSyntax)
                continue;

            Optional<object?> caseConstantOptional =
                semanticModel.GetConstantValue(caseSwitchLabelSyntax.Value, cancellationToken);

            if (caseConstantOptional.HasValue &&
                AuditProofConstantValuesEqual(discriminant, caseConstantOptional.Value))
            {
                return true;
            }
        }

        if (!sectionHasDefaultLabel)
            return false;

        foreach (SwitchSectionSyntax otherSectionSyntax in switchStatementSyntax.Sections)
        {
            foreach (SwitchLabelSyntax otherLabelSyntax in otherSectionSyntax.Labels)
            {
                if (otherLabelSyntax is not CaseSwitchLabelSyntax otherCaseLabelSyntax)
                    continue;

                Optional<object?> otherCaseConstantOptional =
                    semanticModel.GetConstantValue(otherCaseLabelSyntax.Value, cancellationToken);

                if (otherCaseConstantOptional.HasValue &&
                    AuditProofConstantValuesEqual(discriminant, otherCaseConstantOptional.Value))
                {
                    return false;
                }
            }
        }

        return true;
    }

    private static bool AuditProofConstantValuesEqual(object? left, object? right)
    {
        if (left is null || right is null)
            return left is null && right is null;

        if (left.Equals(right))
            return true;

        if (left is int leftInt && right is int rightInt)
            return leftInt == rightInt;

        if (left is long leftLong && right is long rightLong)
            return leftLong == rightLong;

        return string.Equals(left.ToString(), right.ToString(), StringComparison.Ordinal);
    }

    internal static bool TrackedVerbAttribute(string attributeSimpleNameScoped)
    {
        return attributeSimpleNameScoped is HttpPostAttributeShortName
            or HttpPutAttributeShortName
            or HttpDeleteAttributeShortName
            or HttpPatchAttributeShortName;
    }

    private static bool MethodSpecifiesTrackedVerb(IMethodSymbol methodDeclaredSymbolScoped)
    {
        if (MethodHasTrackedVerbAttribute(methodDeclaredSymbolScoped))
            return true;

        for (IMethodSymbol? overriddenMethod = methodDeclaredSymbolScoped.OverriddenMethod;
             overriddenMethod is not null;
             overriddenMethod = overriddenMethod.OverriddenMethod)
        {
            if (MethodHasTrackedVerbAttribute(overriddenMethod))
                return true;
        }

        if (MethodInheritsTrackedVerbFromInterfaces(methodDeclaredSymbolScoped))
            return true;

        return false;
    }

    private static bool MethodInheritsTrackedVerbFromInterfaces(IMethodSymbol methodDeclaredSymbolScoped)
    {
        foreach (IMethodSymbol explicitImplementation in methodDeclaredSymbolScoped.ExplicitInterfaceImplementations)
        {
            if (MethodHasTrackedVerbAttribute(explicitImplementation))
                return true;
        }

        INamedTypeSymbol containingType = methodDeclaredSymbolScoped.ContainingType;

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

                if (implementation is null || !SymbolEqualityComparer.Default.Equals(implementation, methodDeclaredSymbolScoped))
                    continue;

                if (MethodHasTrackedVerbAttribute(interfaceMethod))
                    return true;
            }
        }

        return false;
    }

    private static bool MethodHasTrackedVerbAttribute(IMethodSymbol methodDeclaredSymbolScoped)
    {
        // ReSharper disable once ForeachCanBePartlyConvertedToQueryUsingAnotherGetEnumerator
        foreach (AttributeData attributeDataScoped in methodDeclaredSymbolScoped.GetAttributes())
        {
            INamedTypeSymbol? attributeWalkerNameScoped = attributeDataScoped.AttributeClass;

            for (; attributeWalkerNameScoped is not null;
                   attributeWalkerNameScoped = attributeWalkerNameScoped.BaseType)
            {
                if (TrackedVerbAttribute(attributeWalkerNameScoped.Name))
                    return true;

                if (string.Equals(attributeWalkerNameScoped.Name, HttpMethodAttributeShortName, StringComparison.Ordinal) &&
                    HttpMethodAttributeDeclaresMutatingVerb(attributeDataScoped))
                {
                    return true;
                }

                if (string.Equals(attributeWalkerNameScoped.Name, AcceptVerbsAttributeShortName, StringComparison.Ordinal) &&
                    HttpMethodAttributeDeclaresMutatingVerb(attributeDataScoped))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool HttpMethodAttributeDeclaresMutatingVerb(AttributeData attributeDataScoped)
    {
        foreach (TypedConstant constructorArgument in attributeDataScoped.ConstructorArguments)
        {
            if (TypedConstantContainsMutatingHttpMethod(constructorArgument))
                return true;
        }

        foreach (KeyValuePair<string, TypedConstant> namedArgument in attributeDataScoped.NamedArguments)
        {
            if (!string.Equals(namedArgument.Key, "Method", StringComparison.Ordinal) &&
                !string.Equals(namedArgument.Key, "Methods", StringComparison.Ordinal))
            {
                continue;
            }

            if (TypedConstantContainsMutatingHttpMethod(namedArgument.Value))
                return true;
        }

        return false;
    }

    private static bool TypedConstantContainsMutatingHttpMethod(TypedConstant typedConstant)
    {
        if (typedConstant.Kind == TypedConstantKind.Array)
        {
            foreach (TypedConstant element in typedConstant.Values)
            {
                if (element.Value is string method && IsMutatingHttpMethodName(method))
                    return true;
            }

            return false;
        }

        if (typedConstant.Value is string singleMethod && IsMutatingHttpMethodName(singleMethod))
            return true;

        return false;
    }

    private static bool IsMutatingHttpMethodName(string method) =>
        method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
        method.Equals("PUT", StringComparison.OrdinalIgnoreCase) ||
        method.Equals("DELETE", StringComparison.OrdinalIgnoreCase) ||
        method.Equals("PATCH", StringComparison.OrdinalIgnoreCase);

    internal static bool MutatingAuditExcludeApplies(
        INamedTypeSymbol? exclusionAttributeSymbolScoped,
        IMethodSymbol methodDeclaredSymbolScoped)
    {
        if (exclusionAttributeSymbolScoped is null)
            return false;

        foreach (AttributeData attributeDataExcluded in methodDeclaredSymbolScoped.GetAttributes())
        {
            if (SymbolEqualityComparer.Default.Equals(attributeDataExcluded.AttributeClass,
                    exclusionAttributeSymbolScoped))
                return true;
        }

        for (IMethodSymbol? overriddenMethod = methodDeclaredSymbolScoped.OverriddenMethod;
             overriddenMethod is not null;
             overriddenMethod = overriddenMethod.OverriddenMethod)
        {
            if (MethodHasTrackedVerbAttribute(methodDeclaredSymbolScoped))
                break;

            foreach (AttributeData baseMethodExcluded in overriddenMethod.GetAttributes())
            {
                if (SymbolEqualityComparer.Default.Equals(baseMethodExcluded.AttributeClass,
                        exclusionAttributeSymbolScoped))
                    return true;
            }
        }

        INamedTypeSymbol? nestedTypeWalker = methodDeclaredSymbolScoped.ContainingType;

        while (nestedTypeWalker is not null)
        {
            for (INamedTypeSymbol? inheritWalker = nestedTypeWalker;
                 inheritWalker is not null;
                 inheritWalker = inheritWalker.BaseType)
            {
                foreach (AttributeData owningTypeExcluded in inheritWalker.GetAttributes())
                {
                    if (SymbolEqualityComparer.Default.Equals(owningTypeExcluded.AttributeClass,
                            exclusionAttributeSymbolScoped))
                        return true;
                }
            }

            nestedTypeWalker = nestedTypeWalker.ContainingType;
        }

        if (MethodInheritsMutatingAuditExcludeFromInterfaces(exclusionAttributeSymbolScoped, methodDeclaredSymbolScoped))
            return true;

        return false;
    }

    private static bool MethodInheritsMutatingAuditExcludeFromInterfaces(
        INamedTypeSymbol exclusionAttributeSymbolScoped,
        IMethodSymbol methodDeclaredSymbolScoped)
    {
        foreach (IMethodSymbol explicitImplementation in methodDeclaredSymbolScoped.ExplicitInterfaceImplementations)
        {
            if (MethodHasMutatingAuditExcludeAttribute(explicitImplementation, exclusionAttributeSymbolScoped))
                return true;
        }

        INamedTypeSymbol containingType = methodDeclaredSymbolScoped.ContainingType;

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

                if (implementation is null || !SymbolEqualityComparer.Default.Equals(implementation, methodDeclaredSymbolScoped))
                    continue;

                if (MethodHasMutatingAuditExcludeAttribute(interfaceMethod, exclusionAttributeSymbolScoped))
                    return true;
            }
        }

        return false;
    }

    private static bool MethodHasMutatingAuditExcludeAttribute(
        IMethodSymbol methodDeclaredSymbolScoped,
        INamedTypeSymbol exclusionAttributeSymbolScoped)
    {
        foreach (AttributeData attributeDataExcluded in methodDeclaredSymbolScoped.GetAttributes())
        {
            if (SymbolEqualityComparer.Default.Equals(attributeDataExcluded.AttributeClass,
                    exclusionAttributeSymbolScoped))
                return true;
        }

        return false;
    }

    private static bool ControllerTypeHasMutatingAuditExclude(
        INamedTypeSymbol? exclusionAttributeSymbolScoped,
        INamedTypeSymbol controllerTypeSymbolScoped)
    {
        if (exclusionAttributeSymbolScoped is null)
            return false;

        for (INamedTypeSymbol? typeWalker = controllerTypeSymbolScoped;
             typeWalker is not null;
             typeWalker = typeWalker.BaseType)
        {
            foreach (AttributeData attributeDataExcluded in typeWalker.GetAttributes())
            {
                if (SymbolEqualityComparer.Default.Equals(attributeDataExcluded.AttributeClass,
                        exclusionAttributeSymbolScoped))
                {
                    return true;
                }
            }
        }

        for (INamedTypeSymbol? containingTypeWalker = controllerTypeSymbolScoped.ContainingType;
             containingTypeWalker is not null;
             containingTypeWalker = containingTypeWalker.ContainingType)
        {
            for (INamedTypeSymbol? inheritWalker = containingTypeWalker;
                 inheritWalker is not null;
                 inheritWalker = inheritWalker.BaseType)
            {
                foreach (AttributeData owningTypeExcluded in inheritWalker.GetAttributes())
                {
                    if (SymbolEqualityComparer.Default.Equals(owningTypeExcluded.AttributeClass,
                            exclusionAttributeSymbolScoped))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    internal static bool SyntaxBodiesReferenceLogAsync(
        IMethodSymbol methodDeclaredSymbolScoped,
        CancellationToken cancellationTokenScoped)
    {
        foreach (SyntaxReference declaringReferenceScoped in methodDeclaredSymbolScoped.DeclaringSyntaxReferences)
        {
            if (declaringReferenceScoped.GetSyntax(cancellationTokenScoped)
                    .FirstAncestorOrSelf<MethodDeclarationSyntax>() is not { } methodAnchorSyntax)
            {
                continue;
            }

            foreach (SyntaxNode bodySubtreeScoped in EnumerateMethodBodies(methodAnchorSyntax))
            {
                foreach (InvocationExpressionSyntax invocationSyntaxScoped in bodySubtreeScoped
                             .DescendantNodesAndSelf()
                             .OfType<InvocationExpressionSyntax>())
                {
                    if (invocationSyntaxScoped.Expression is MemberAccessExpressionSyntax memberAccessExpressionSyntax &&
                        LogAsyncMemberAccessCountsForAuditProof(
                            memberAccessExpressionSyntax,
                            methodAnchorSyntax,
                            semanticModel: null,
                            cancellationTokenScoped))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    internal static bool SemanticBodiesInvokeAuditLogAsync(
        SemanticModel semanticModelScoped,
        INamedTypeSymbol auditInterfaceDeclaredTypeSymbolScoped,
        IMethodSymbol controllerActionDeclaredSymbolScoped,
        CancellationToken cancellationTokenScoped)
    {
        SyntaxTree semanticModelTreeScoped = semanticModelScoped.SyntaxTree;

        foreach (SyntaxNode? syntaxFromReferenceScoped in from declaringReferenceScoped in controllerActionDeclaredSymbolScoped
                     .DeclaringSyntaxReferences
                                                          where ReferenceEquals(declaringReferenceScoped.SyntaxTree, semanticModelTreeScoped)
                                                          select declaringReferenceScoped.GetSyntax(cancellationTokenScoped))
        {
            if (syntaxFromReferenceScoped.FirstAncestorOrSelf<MethodDeclarationSyntax>() is not { } methodAnchorSyntax)
            {
                continue;
            }

            if (EnumerateMethodBodies(methodAnchorSyntax).SelectMany(bodySubtreeScoped => bodySubtreeScoped
                    .DescendantNodesAndSelf()
                    .OfType<InvocationExpressionSyntax>()).Any(invocationSyntaxScoped =>
                    AuditLogAsyncInvocationCountsForAuditProof(
                        invocationSyntaxScoped,
                        methodAnchorSyntax,
                        semanticModelScoped,
                        cancellationTokenScoped) &&
                    InvocationMatchesAuditInterfaceSemantic(
                    semanticModelScoped,
                    auditInterfaceDeclaredTypeSymbolScoped,
                    invocationSyntaxScoped,
                    cancellationTokenScoped)))
            {
                return true;
            }
        }

        return false;
    }

    internal static bool InvocationMatchesAuditInterfaceSemantic(
        SemanticModel semanticModelSemanticInvocation,
        INamedTypeSymbol auditInterfaceDeclaredTypeSymbolScopedSemantic,
        InvocationExpressionSyntax invocationExpressionSyntaxSemantic,
        CancellationToken cancellationTokenSemantic)
    {
        if (semanticModelSemanticInvocation.GetSymbolInfo(invocationExpressionSyntaxSemantic,
                   cancellationTokenSemantic)
               .Symbol
           is not IMethodSymbol calleeSemantic)
            return false;

        if (!string.Equals(calleeSemantic.Name, "LogAsync", StringComparison.Ordinal))
            return false;

        if (SymbolEqualityComparer.Default.Equals(
                calleeSemantic.ContainingType?.OriginalDefinition,
                auditInterfaceDeclaredTypeSymbolScopedSemantic.OriginalDefinition))
            return true;

        INamedTypeSymbol? containingType = calleeSemantic.ContainingType;

        if (containingType is null)
            return false;

        foreach (INamedTypeSymbol iface in containingType.AllInterfaces)
        {
            if (!SymbolEqualityComparer.Default.Equals(
                    iface.OriginalDefinition,
                    auditInterfaceDeclaredTypeSymbolScopedSemantic.OriginalDefinition))
            {
                continue;
            }

            foreach (ISymbol member in iface.GetMembers(calleeSemantic.Name))
            {
                if (member is not IMethodSymbol interfaceMethod)
                    continue;

                IMethodSymbol? implementation =
                    containingType.FindImplementationForInterfaceMember(interfaceMethod) as IMethodSymbol;

                if (implementation is not null &&
                    SymbolEqualityComparer.Default.Equals(implementation, calleeSemantic))
                {
                    return true;
                }
            }
        }

        return false;
    }
}

