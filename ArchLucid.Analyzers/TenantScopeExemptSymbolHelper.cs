using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers;

internal static class TenantScopeExemptSymbolHelper
{
    internal sealed class ExemptionInfo
    {
        internal ExemptionInfo(TenantScopeExemptReason reason, string justification, Location location)
        {
            Reason = reason;
            Justification = justification;
            Location = location;
        }

        internal TenantScopeExemptReason Reason { get; }

        internal string Justification { get; }

        internal Location Location { get; }
    }

    internal enum TenantScopeExemptReason
    {
        AcceptedResidual,
        SystemPlaneOnly,
        Operational,
    }

    internal static ExemptionInfo? TryGetExemption(ISymbol? symbol, Compilation compilation)
    {
        for (ISymbol? current = symbol; current is not null; current = current.ContainingSymbol)
        {
            ExemptionInfo? exemption = TryReadExemptionFromAttributes(current, compilation);

            if (exemption is not null)
                return exemption;
        }

        return null;
    }

    internal static IEnumerable<Diagnostic> ValidateExemptionAttributes(ISymbol symbol, Compilation compilation)
    {
        foreach (AttributeData attribute in GetTenantScopeExemptAttributes(symbol, compilation))
        {
            if (attribute.ApplicationSyntaxReference is null)
                continue;

            SyntaxNode? syntax = attribute.ApplicationSyntaxReference.GetSyntax();

            if (syntax is null)
                continue;

            string? justification = ReadJustificationArgument(attribute);

            if (string.IsNullOrWhiteSpace(justification))
            {
                yield return Arch006Descriptor.CreateEmptyExemptionJustification(
                    syntax.GetLocation(),
                    symbol.ToDisplayString());
            }
        }
    }

    private static ExemptionInfo? TryReadExemptionFromAttributes(ISymbol symbol, Compilation compilation)
    {
        foreach (AttributeData attribute in GetTenantScopeExemptAttributes(symbol, compilation))
        {
            TenantScopeExemptReason reason = ReadReasonArgument(attribute);
            string? justification = ReadJustificationArgument(attribute);

            if (string.IsNullOrWhiteSpace(justification))
                continue;

            Location location = attribute.ApplicationSyntaxReference?.GetSyntax()?.GetLocation()
                                ?? symbol.Locations.FirstOrDefault()
                                ?? Location.None;

            return new ExemptionInfo(reason, justification!, location);
        }

        return null;
    }

    private static IEnumerable<AttributeData> GetTenantScopeExemptAttributes(ISymbol symbol, Compilation compilation)
    {
        INamedTypeSymbol? exemptAttribute = compilation.GetTypeByMetadataName("ArchLucid.Core.Tenancy.TenantScopeExemptAttribute");

        if (exemptAttribute is null)
            yield break;

        foreach (AttributeData attribute in symbol.GetAttributes())
        {
            if (SymbolEqualityComparer.Default.Equals(attribute.AttributeClass, exemptAttribute))
                yield return attribute;
        }
    }

    private static TenantScopeExemptReason ReadReasonArgument(AttributeData attribute)
    {
        if (attribute.ConstructorArguments.Length == 0)
            return TenantScopeExemptReason.AcceptedResidual;

        if (attribute.ConstructorArguments[0].Value is int reasonValue)
            return (TenantScopeExemptReason)reasonValue;

        return TenantScopeExemptReason.AcceptedResidual;
    }

    private static string? ReadJustificationArgument(AttributeData attribute)
    {
        if (attribute.ConstructorArguments.Length > 1 &&
            attribute.ConstructorArguments[1].Value is string justification)
            return justification;

        foreach (KeyValuePair<string, TypedConstant> named in attribute.NamedArguments)
        {
            if (string.Equals(named.Key, "justification", StringComparison.OrdinalIgnoreCase) &&
                named.Value.Value is string namedJustification)
                return namedJustification;
        }

        return null;
    }
}
