using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers;

/// <summary>
/// Recognizes the narrow existing SecureNow exchange guard shape.
/// Not a general control-flow or security proof; unexpected syntax fails closed
/// to existing advisory diagnostics.
/// </summary>
internal static class SecureNowExchangeModePattern
{
    internal static bool HasTwoGuardedExchangeChecks(MethodDeclarationSyntax method)
    {
        if (method.Body is null)
            return false;
        var checks = method.Body.DescendantNodes().OfType<IfStatementSyntax>()
            .Where(x => x.Condition is IdentifierNameSyntax id &&
                        id.Identifier.ValueText == "secureNowExchange")
            .OrderBy(x => x.SpanStart).ToArray();
        if (checks.Length < 2)
            return false;

        // Both checks must include a distinct gate and a terminating denial
        // branch; first before the anchor read, second before the detail read.
        var guarded = checks.Where(ContainsGateAndDenialReturn).ToArray();
        if (guarded.Length < 2)
            return false;
        var anchor = method.Body.DescendantNodes().OfType<InvocationExpressionSyntax>()
            .FirstOrDefault(x => x.Expression is MemberAccessExpressionSyntax m &&
                                 m.Name.Identifier.ValueText == "GetByIdAsync");
        var detail = method.Body.DescendantNodes().OfType<InvocationExpressionSyntax>()
            .FirstOrDefault(x => x.Expression is MemberAccessExpressionSyntax m &&
                                 m.Name.Identifier.ValueText == "GetRunDetailAsync");
        return anchor is not null && detail is not null &&
               guarded[0].SpanStart < anchor.SpanStart &&
               guarded[1].SpanStart > anchor.SpanStart &&
               guarded[1].SpanStart < detail.SpanStart;
    }

    private static bool ContainsGateAndDenialReturn(IfStatementSyntax conditional)
    {
        if (conditional.Statement is not BlockSyntax block)
            return false;
        var gates = block.DescendantNodes().OfType<InvocationExpressionSyntax>()
            .Where(x => x.Expression is MemberAccessExpressionSyntax m &&
                        m.Name.Identifier.ValueText == "AuthorizeAsync").ToArray();
        if (gates.Length != 1)
            return false;
        return block.Statements.OfType<IfStatementSyntax>().Any(denial =>
            denial.Condition is PrefixUnaryExpressionSyntax negative &&
            negative.IsKind(SyntaxKind.LogicalNotExpression) &&
            negative.Operand is MemberAccessExpressionSyntax allowed &&
            allowed.Name.Identifier.ValueText == "Allowed" &&
            (denial.Statement is ReturnStatementSyntax ||
             denial.Statement is BlockSyntax b &&
             b.Statements.LastOrDefault() is ReturnStatementSyntax));
    }
}
