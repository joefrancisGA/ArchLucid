using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Operations;

namespace ArchLucid.Analyzers;

/// <summary>Enforces shared enum parsing and inventories explicit enum conversions.</summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class EnumBoundaryReviewAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "ENUM001";
    public const string BlockingDiagnosticId = "ENUM002";
    public const string CoverageDiagnosticId = "ENUM000";

    internal static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "Review raw enum conversion",
        "Raw enum conversion '{0}' requires declared-value or flags-mask validation",
        "Architecture",
        DiagnosticSeverity.Info,
        isEnabledByDefault: true,
        customTags: new[] { WellKnownDiagnosticTags.NotConfigurable });

    internal static readonly DiagnosticDescriptor BlockingRule = new(
        BlockingDiagnosticId,
        "Use validated enum boundary conversion",
        "Raw enum conversion '{0}' must use an explicitly validated boundary parser",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        customTags: new[] { WellKnownDiagnosticTags.NotConfigurable });

    internal static readonly DiagnosticDescriptor CoverageRule = new(
        CoverageDiagnosticId,
        "Enum audit coverage",
        "Enum boundary analyzer executed for '{0}'",
        "Architecture",
        DiagnosticSeverity.Info,
        isEnabledByDefault: true,
        customTags: new[] { WellKnownDiagnosticTags.CompilationEnd, WellKnownDiagnosticTags.NotConfigurable });

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule, BlockingRule, CoverageRule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(start =>
        {
            string? assembly = start.Compilation.AssemblyName;
            if (assembly is null || !assembly.StartsWith("ArchLucid.", StringComparison.Ordinal)
                || assembly.EndsWith(".Tests", StringComparison.Ordinal)
                || assembly == "ArchLucid.Analyzers")
                return;

            start.RegisterOperationAction(AnalyzeInvocation, OperationKind.Invocation);
            start.RegisterOperationAction(AnalyzeMethodReference, OperationKind.MethodReference);
            start.RegisterOperationAction(AnalyzeConversion, OperationKind.Conversion);

            if (start.Options.AnalyzerConfigOptionsProvider.GlobalOptions.TryGetValue(
                    "build_property.EnumAuditInventory", out string? enabled)
                && string.Equals(enabled, "true", StringComparison.OrdinalIgnoreCase))
            {
                start.RegisterCompilationEndAction(end =>
                    end.ReportDiagnostic(Diagnostic.Create(CoverageRule, Location.None, assembly)));
            }
        });
    }

    private static bool IsRawEnumMethod(IMethodSymbol method) =>
        method.ContainingType.SpecialType == SpecialType.System_Enum
        && method.Name is "Parse" or "TryParse" or "ToObject";

    private static void AnalyzeInvocation(OperationAnalysisContext context)
    {
        if (IsValidationImplementation(context.ContainingSymbol)
            || context.Operation is not IInvocationOperation invocation
            || !IsRawEnumMethod(invocation.TargetMethod))
            return;

        context.ReportDiagnostic(Diagnostic.Create(BlockingRule, invocation.Syntax.GetLocation(),
            invocation.TargetMethod.Name));
    }

    private static void AnalyzeMethodReference(OperationAnalysisContext context)
    {
        if (IsValidationImplementation(context.ContainingSymbol)
            || context.Operation is not IMethodReferenceOperation reference
            || !IsRawEnumMethod(reference.Method))
            return;

        context.ReportDiagnostic(Diagnostic.Create(BlockingRule, reference.Syntax.GetLocation(),
            reference.Method.Name));
    }

    private static ITypeSymbol UnwrapNullable(ITypeSymbol symbol) =>
        symbol is INamedTypeSymbol named && named.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T
            ? named.TypeArguments[0]
            : symbol;

    private static bool IsEnumTarget(ITypeSymbol symbol) =>
        symbol.TypeKind == TypeKind.Enum
        || symbol is ITypeParameterSymbol parameter
            && parameter.ConstraintTypes.Any(static constraint => constraint.SpecialType == SpecialType.System_Enum);

    private static void AnalyzeConversion(OperationAnalysisContext context)
    {
        if (IsValidationImplementation(context.ContainingSymbol)
            || context.Operation is not IConversionOperation conversion
            || conversion.Type is not { } targetType
            || conversion.Operand.Type is not { } sourceType)
            return;

        ITypeSymbol target = UnwrapNullable(targetType);
        ITypeSymbol source = UnwrapNullable(sourceType);
        if (!IsEnumTarget(target) || SymbolEqualityComparer.Default.Equals(source, target))
            return;

        // Explicit conversions (including object unboxing and enum-constrained generics) and
        // the implicit numeric zero conversion can introduce undeclared values.
        if (conversion.Conversion.IsUserDefined)
        {
            context.ReportDiagnostic(Diagnostic.Create(Rule, conversion.Syntax.GetLocation(), "user-defined conversion"));
            return;
        }

        if (conversion.ConstantValue.HasValue && target.GetMembers().OfType<IFieldSymbol>()
            .Any(field => field.HasConstantValue && Equals(field.ConstantValue, conversion.ConstantValue.Value)))
            return;

        // A lifted null literal is legitimate absence, not an invented enum member.
        if (conversion.Operand.ConstantValue.HasValue && conversion.Operand.ConstantValue.Value is null
            && targetType is INamedTypeSymbol nullable
            && nullable.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T)
            return;

        context.ReportDiagnostic(Diagnostic.Create(Rule, conversion.Syntax.GetLocation(), "cast"));
    }

    private static bool IsValidationImplementation(ISymbol containingSymbol)
    {
        INamedTypeSymbol? type = containingSymbol.ContainingType;
        return type is not null
            && type.ContainingAssembly.Name == "ArchLucid.Contracts"
            && type.ContainingNamespace.ToDisplayString() == "ArchLucid.Contracts.Serialization"
            && type.Name is "DefinedEnum" or "DefinedEnumStringReader";
    }
}
