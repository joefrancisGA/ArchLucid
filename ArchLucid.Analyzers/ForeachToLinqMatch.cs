using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers;

/// <summary>Matched foreach pattern for a LINQ-based replacement.</summary>
internal readonly struct ForeachToLinqMatch
{
    internal ForeachToLinqMatch(
        ForeachToLinqKind kind,
        ForEachStatementSyntax statement,
        ExpressionSyntax listReceiver,
        ExpressionSyntax addArgumentExpression,
        ExpressionSyntax? whereCondition)
    {
        Kind = kind;
        Statement = statement;
        ListReceiver = listReceiver;
        AddArgumentExpression = addArgumentExpression;
        WhereCondition = whereCondition;
    }

    internal ForeachToLinqKind Kind { get; }
    internal ForEachStatementSyntax Statement { get; }
    internal ExpressionSyntax ListReceiver { get; }
    internal ExpressionSyntax AddArgumentExpression { get; }
    internal ExpressionSyntax? WhereCondition { get; }
}
