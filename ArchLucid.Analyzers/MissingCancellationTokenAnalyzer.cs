using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class MissingCancellationTokenAnalyzer : DiagnosticAnalyzer
{
    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics
    {
        get;
    } =
        [Arch003Descriptor.Rule];

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterSymbolAction(AnalyzeNamedType, SymbolKind.NamedType);
    }

    private static void AnalyzeNamedType(SymbolAnalysisContext context)
    {
        if (context.Symbol is not INamedTypeSymbol { TypeKind: TypeKind.Interface } iface)
            return;

        if (!IsServiceInterfaceName(iface.Name))
            return;

        INamedTypeSymbol? cancellationToken = context.Compilation.GetTypeByMetadataName("System.Threading.CancellationToken");

        foreach (ISymbol member in iface.GetMembers())
        {
            if (member is not IMethodSymbol method)
                continue;

            if (method.MethodKind != MethodKind.Ordinary)
                continue;

            if (method.IsStatic)
                continue;

            if (!ReturnsTaskOrGenericTask(method))
                continue;

            if (HasArch003Suppression(method))
                continue;

            if (cancellationToken is not null && MethodHasCancellationTokenParameter(method, cancellationToken))
                continue;

            Location loc = method.Locations.Length > 0 ? method.Locations[0] : Location.None;

            context.ReportDiagnostic(Arch003Descriptor.Create(loc, method.ToDisplayString()));
        }
    }

    private static bool IsServiceInterfaceName(string interfaceName)
    {
        return interfaceName.Length > "IService".Length &&
               interfaceName.StartsWith("I", StringComparison.Ordinal) &&
               interfaceName.EndsWith("Service", StringComparison.Ordinal);
    }

    private static bool ReturnsTaskOrGenericTask(IMethodSymbol method)
    {
        INamedTypeSymbol? returnType = method.ReturnType as INamedTypeSymbol;

        if (returnType is null)
            return false;

        if (returnType.OriginalDefinition.SpecialType == SpecialType.System_Void)
            return false;

        if (returnType.OriginalDefinition.SpecialType == SpecialType.System_Object)
            return false;

        if (returnType is { IsGenericType: true, TypeArguments.Length: 1 } generic &&
            IsSystemThreadingTasksTaskSymbol(generic.OriginalDefinition))
            return true;

        return IsSystemThreadingTasksTaskSymbol(returnType);
    }

    private static bool IsSystemThreadingTasksTaskSymbol(INamedTypeSymbol named)
    {
        return named is { Name: "Task", ContainingNamespace: { } ns } &&
               string.Equals(ns.ToDisplayString(), "System.Threading.Tasks", StringComparison.Ordinal);
    }

    private static bool MethodHasCancellationTokenParameter(IMethodSymbol method, INamedTypeSymbol cancellationToken)
    {
        foreach (IParameterSymbol parameter in method.Parameters)
        {
            if (SymbolEqualityComparer.Default.Equals(parameter.Type, cancellationToken))
                return true;
        }

        return false;
    }

    private static bool HasArch003Suppression(ISymbol symbol)
    {
        foreach (ImmutableArray<TypedConstant> args in from attr in symbol.GetAttributes() where attr.AttributeClass?.ToDisplayString() == "System.Diagnostics.CodeAnalysis.SuppressMessageAttribute" select attr.ConstructorArguments)
        {
            /* Standard ctor: SuppressMessage(category, checkId, ...). Rule id is typically the second positional arg. */
            if (args.Length >= 2 &&
                args[1].Value is string checkId &&
                string.Equals(checkId, "ARCH003", StringComparison.Ordinal))
                return true;

            /* Alternate shapes where the rule id is the first string argument. */
            if (args.Length >= 1 &&
                args[0].Value is string first &&
                string.Equals(first, "ARCH003", StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
