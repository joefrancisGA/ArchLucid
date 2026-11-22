using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.FlowAnalysis;
using Microsoft.CodeAnalysis.Operations;

namespace ArchLucid.Analyzers;

/// <summary>
/// Advisory CFG dominance check for the SecureNow temporal snapshot endpoint.
/// A gate invocation must dominate each protected read. This proves invocation
/// ordering on reachable CFG paths, NOT that the gate returned Allowed=true.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class SnapshotAuthorizationDominanceAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "FND017004";
    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId, "Evidence authorization gate must dominate protected read",
        "Protected read '{0}' is not dominated by {1} evidence authorization gate call(s)",
        "Architecture", DiagnosticSeverity.Info, isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterOperationBlockAction(Analyze);
    }

    private static void Analyze(OperationBlockAnalysisContext context)
    {
        if (context.Compilation.AssemblyName != "ArchLucid.Api" ||
            context.OwningSymbol is not IMethodSymbol method ||
            method.Name != "GetArchitectureGraphTemporalSnapshot")
            return;

        // Conditional SecureNow exchange authorization is not expected to
        // dominate ordinary graph reads. Suppress the unconditional CFG rule
        // only for the recognized dual-guard exchange pattern.
        var declaration = method.DeclaringSyntaxReferences.FirstOrDefault()?.GetSyntax()
            as MethodDeclarationSyntax;
        if (declaration is not null &&
            SecureNowExchangeModePattern.HasTwoGuardedExchangeChecks(declaration))
            return;

        foreach (var root in context.OperationBlocks)
        {
            if (root is not IMethodBodyOperation body)
                continue;
            ControlFlowGraph graph;
            try { graph = ControlFlowGraph.Create(body); }
            catch (ArgumentException) { continue; }
            var blocks = graph.Blocks.ToArray();
            if (blocks.Length == 0)
                continue;
            var reachable = Reachable(blocks);
            var dominators = ComputeDominators(blocks, reachable);
            var gates = new List<(BasicBlock Block, int Position)>();
            var reads = new List<(BasicBlock Block, int Position, IInvocationOperation Call)>();
            foreach (var block in blocks.Where(b => reachable.Contains(b.Ordinal)))
            {
                int position = 0;
                foreach (var operation in block.Operations.Concat(
                    block.BranchValue is null ? Enumerable.Empty<IOperation>() :
                    new[] { block.BranchValue }))
                {
                    foreach (var invocation in Walk(operation).OfType<IInvocationOperation>())
                    {
                        if (IsGate(invocation))
                            gates.Add((block, position));
                        if (IsRead(invocation))
                            reads.Add((block, position, invocation));
                        position++;
                    }
                }
            }
            foreach (var read in reads)
            {
                int required = read.Call.TargetMethod.Name == "GetRunDetailAsync" ? 2 : 1;
                int count = gates.Count(g =>
                    (g.Block.Ordinal == read.Block.Ordinal && g.Position < read.Position) ||
                    (g.Block.Ordinal != read.Block.Ordinal &&
                     dominators[read.Block.Ordinal].Contains(g.Block.Ordinal)));
                if (count < required)
                    context.ReportDiagnostic(Diagnostic.Create(Rule,
                        read.Call.Syntax.GetLocation(),
                        read.Call.TargetMethod.Name, required));
            }
        }
    }

    private static bool IsGate(IInvocationOperation invocation) =>
        invocation.TargetMethod.Name == "AuthorizeAsync" &&
        invocation.TargetMethod.ContainingType.Name == "EvidenceReadAuthorizationGate";

    private static bool IsRead(IInvocationOperation invocation)
    {
        var method = invocation.TargetMethod;
        return (method.Name == "GetByIdAsync" && HasReceiver(invocation, "IRunRepository")) ||
               (method.Name == "GetRunDetailAsync" &&
                HasReceiver(invocation, "IAuthorityQueryService"));
    }

    private static bool HasReceiver(IInvocationOperation invocation, string name)
    {
        var type = invocation.Instance?.Type;
        return type?.Name == name || type?.AllInterfaces.Any(x => x.Name == name) == true ||
               invocation.TargetMethod.ContainingType.Name == name;
    }

    private static IEnumerable<IOperation> Walk(IOperation root)
    {
        yield return root;
        foreach (var child in root.ChildOperations)
            foreach (var descendant in Walk(child))
                yield return descendant;
    }

    private static HashSet<int> Reachable(BasicBlock[] blocks)
    {
        var found = new HashSet<int>();
        var pending = new Stack<BasicBlock>();
        pending.Push(blocks[0]);
        while (pending.Count > 0)
        {
            var current = pending.Pop();
            if (!found.Add(current.Ordinal))
                continue;
            if (current.FallThroughSuccessor.Destination is { } fall)
                pending.Push(fall);
            if (current.ConditionalSuccessor.Destination is { } conditional)
                pending.Push(conditional);
        }
        return found;
    }

    private static Dictionary<int, HashSet<int>> ComputeDominators(
        BasicBlock[] blocks, HashSet<int> reachable)
    {
        var all = new HashSet<int>(reachable);
        var result = reachable.ToDictionary(i => i, i =>
            i == blocks[0].Ordinal ? new HashSet<int> { i } : new HashSet<int>(all));
        bool changed;
        do
        {
            changed = false;
            foreach (var block in blocks.Where(b => reachable.Contains(b.Ordinal) &&
                                                       b.Ordinal != blocks[0].Ordinal))
            {
                var parents = block.Predecessors.Select(p => p.Source.Ordinal)
                    .Where(reachable.Contains).Distinct().ToArray();
                var next = parents.Length == 0 ? new HashSet<int>() :
                    new HashSet<int>(result[parents[0]]);
                foreach (var parent in parents.Skip(1))
                    next.IntersectWith(result[parent]);
                next.Add(block.Ordinal);
                if (result[block.Ordinal].SetEquals(next))
                    continue;
                result[block.Ordinal] = next;
                changed = true;
            }
        } while (changed);
        return result;
    }
}
