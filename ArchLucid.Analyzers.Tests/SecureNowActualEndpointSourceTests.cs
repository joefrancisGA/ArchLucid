using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
/// Source-grounded integration guard: tests the checked-in endpoint instead of
/// only synthetic examples. These tests validate structural invariants, not
/// runtime authorization success or full CFG semantics.
/// </summary>
public sealed class SecureNowActualEndpointSourceTests
{
    private static MethodDeclarationSyntax LoadEndpoint()
    {
        const string path = "ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs";

        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            for (DirectoryInfo? directory = new(start); directory is not null;
                 directory = directory.Parent)
            {
                string file = Path.Combine(directory.FullName, path);

                if (!File.Exists(file))
                    continue;
                var root = CSharpSyntaxTree.ParseText(File.ReadAllText(file)).GetRoot();
                return root.DescendantNodes().OfType<MethodDeclarationSyntax>().Single(
                    method => method.Identifier.ValueText ==
                              "GetArchitectureGraphTemporalSnapshot");
            }
        }

        throw new FileNotFoundException("Real SecureNow endpoint source unavailable", path);
    }

    private static InvocationExpressionSyntax[] Calls(
        MethodDeclarationSyntax method, string name) =>
        method.DescendantNodes().OfType<InvocationExpressionSyntax>()
            .Where(x => x.Expression switch
            {
                MemberAccessExpressionSyntax member => member.Name.Identifier.ValueText == name,
                IdentifierNameSyntax identifier => identifier.Identifier.ValueText == name,
                _ => false
            })
            .OrderBy(x => x.SpanStart).ToArray();

    [Fact]
    public void Real_endpoint_has_two_conditional_denial_gates()
    {
        Assert.True(SecureNowExchangeModePattern.HasTwoGuardedExchangeChecks(
            LoadEndpoint()));
    }

    [Fact]
    public void Real_endpoint_authorizes_anchor_and_resolved_ids_separately()
    {
        var gates = Calls(LoadEndpoint(), "AuthorizeAsync");
        Assert.Equal(2, gates.Length);
        Assert.Equal(6, gates[0].ArgumentList.Arguments.Count);
        Assert.Equal(6, gates[1].ArgumentList.Arguments.Count);
        Assert.Equal("runId", gates[0].ArgumentList.Arguments[4].Expression.ToString());
        Assert.Equal("resolved.RunId",
            gates[1].ArgumentList.Arguments[4].Expression.ToString());

        foreach (var gate in gates)
        {
            var args = gate.ArgumentList.Arguments.Select(x => x.Expression.ToString()).ToArray();
            Assert.Equal("User", args[0]);
            Assert.Equal("scope.TenantId", args[1]);
            Assert.Equal("scope.WorkspaceId", args[2]);
            Assert.Equal("scope.ProjectId", args[3]);
            Assert.Equal("ct", args[5]);
        }
    }

    [Fact]
    public void Real_endpoint_rejects_cross_project_resolution_before_detail()
    {
        var endpoint = LoadEndpoint();
        var check = endpoint.DescendantNodes().OfType<IfStatementSyntax>().Single(
            x => x.Condition.ToString().Replace(" ", "") ==
                 "resolved.ProjectId!=anchor.ProjectId");
        Assert.Contains("return NotFound()", check.Statement.ToString());
        var resolvedGate = Calls(endpoint, "AuthorizeAsync")[1];
        var detail = Calls(endpoint, "GetRunDetailAsync").Single();
        Assert.True(check.SpanStart < resolvedGate.SpanStart &&
                    resolvedGate.SpanStart < detail.SpanStart);
    }

    [Fact]
    public void Real_endpoint_keeps_ordinary_and_exchange_result_paths_distinct()
    {
        var endpoint = LoadEndpoint();
        var returns = Calls(endpoint, "Ok");
        Assert.Contains(returns, x => x.ArgumentList.ToString() == "(exchange)" &&
            x.Ancestors().OfType<IfStatementSyntax>().Any(i =>
                i.Condition.ToString() == "secureNowExchange"));
        Assert.Contains(returns, x => x.ArgumentList.ToString() == "(body)" &&
            !x.Ancestors().OfType<IfStatementSyntax>().Any(i =>
                i.Condition.ToString() == "secureNowExchange"));
    }
}
