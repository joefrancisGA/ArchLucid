using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Operations;

namespace ArchLucid.Analyzers;

/// <summary>
/// Advisory inventory for raw enum conversions. A diagnostic requests review; it does not prove
/// the absence of a later guard. Move boundary parsing to the validated contract helper.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class EnumBoundaryReviewAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "ENUM001";
    public const string BlockingDiagnosticId = "ENUM002";

    internal static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "Review raw enum conversion",
        "Raw enum conversion '{0}' requires declared-value or flags-mask validation",
        "Architecture",
        DiagnosticSeverity.Info,
        isEnabledByDefault: true);

    internal static readonly DiagnosticDescriptor BlockingRule = new(
        BlockingDiagnosticId,
        "Use validated enum boundary conversion",
        "Raw enum conversion '{0}' must use an explicitly validated boundary parser",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(Rule, BlockingRule);

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
            start.RegisterOperationAction(AnalyzeConversion, OperationKind.Conversion);
        });
    }

    private static void AnalyzeInvocation(OperationAnalysisContext context)
    {
        if (IsValidationImplementation(context.ContainingSymbol)
            || context.Operation is not IInvocationOperation invocation)
            return;

        IMethodSymbol method = invocation.TargetMethod;
        if (method.ContainingType.SpecialType == SpecialType.System_Enum
            && method.Name is "Parse" or "TryParse" or "ToObject")
        {
            // Direct Parse/ToObject and discarded TryParse are not permitted at product boundaries.
            // TryParse with an observed result remains an inventory finding until reviewed.
            bool blocking = method.Name is "Parse" or "ToObject"
                || (method.Name == "TryParse" && invocation.Parent is IExpressionStatementOperation);
            context.ReportDiagnostic(Diagnostic.Create(blocking ? BlockingRule : Rule,
                invocation.Syntax.GetLocation(), method.Name));
        }
    }

    private static void AnalyzeConversion(OperationAnalysisContext context)
    {
        if (IsValidationImplementation(context.ContainingSymbol)
            || context.Operation is not IConversionOperation conversion
            || conversion.IsImplicit
            || conversion.Type is not INamedTypeSymbol { TypeKind: TypeKind.Enum } target
            || conversion.Operand.Type is not { } source
            || SymbolEqualityComparer.Default.Equals(source, target))
            return;

        if (source.TypeKind != TypeKind.Enum && source.SpecialType is not
            (SpecialType.System_SByte or SpecialType.System_Byte or
             SpecialType.System_Int16 or SpecialType.System_UInt16 or
             SpecialType.System_Int32 or SpecialType.System_UInt32 or
             SpecialType.System_Int64 or SpecialType.System_UInt64))
            return;

        // A compile-time value equal to a declared enum member is already known-valid.
        if (conversion.ConstantValue.HasValue && target.GetMembers().OfType<IFieldSymbol>()
            .Any(field => field.HasConstantValue && Equals(field.ConstantValue, conversion.ConstantValue.Value)))
            return;

        context.ReportDiagnostic(Diagnostic.Create(Rule, conversion.Syntax.GetLocation(), "cast"));
    }

    private static bool IsValidationImplementation(ISymbol containingSymbol)
    {
        INamedTypeSymbol? type = containingSymbol.ContainingType;
        return type is not null
            && type.ContainingNamespace.ToDisplayString() == "ArchLucid.Contracts.Serialization"
            && type.Name is "DefinedEnum" or "DefinedEnumStringReader";
    }
}
