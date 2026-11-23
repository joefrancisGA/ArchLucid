using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers.Tests;

public sealed class SecureNowExchangeModePatternTests
{
    private static bool Recognized(string secondGuard)
    {
        string source = """
              class C {
              bool secureNowExchange;
              object gate;
              object runRepository;
              object authorityQueryService;
              object scope;
              object User;
              object ct;
              object runId;
              object resolved;
              object GetArchitectureGraphTemporalSnapshot() {
                if (secureNowExchange) {
                  var access = gate.AuthorizeAsync(User, scope, runId, ct);
                  if (!access.Allowed) return null;
                }
                var anchor = runRepository.GetByIdAsync();
              """ + secondGuard + """
                var detail = authorityQueryService.GetRunDetailAsync();
                return detail;
              }
            }
            """;
        var tree = CSharpSyntaxTree.ParseText(source);
        var method = tree.GetRoot().DescendantNodes()
              .OfType<MethodDeclarationSyntax>().Single();
        return SecureNowExchangeModePattern.HasTwoGuardedExchangeChecks(method);
    }

    [Fact]
    public void Two_mode_specific_guards_are_recognized()
    {
        Assert.True(Recognized("""
              if (secureNowExchange) {
                var resolvedAccess = gate.AuthorizeAsync(User, scope, resolved, ct);
                if (!resolvedAccess.Allowed) return null;
              }
              """));
    }

    [Fact]
    public void Missing_resolved_guard_is_not_exempt()
    {
        Assert.False(Recognized("if (secureNowExchange) { return null; }"));
    }

    [Fact]
    public void Ignored_resolved_decision_is_not_exempt()
    {
        Assert.False(Recognized("""
              if (secureNowExchange) {
                var resolvedAccess = gate.AuthorizeAsync(User, scope, resolved, ct);
              }
              """));
    }

    [Fact]
    public void Nonterminating_denial_is_not_exempt()
    {
        Assert.False(Recognized("""
              if (secureNowExchange) {
                var resolvedAccess = gate.AuthorizeAsync(User, scope, resolved, ct);
                if (!resolvedAccess.Allowed) { var ignored = 1; }
              }
              """));
    }
    [Fact]
    public void Additional_unprotected_anchor_read_is_not_exempt()
    {
        Assert.False(Recognized("""
              runRepository.GetByIdAsync();
              if (secureNowExchange) {
                var resolvedAccess = gate.AuthorizeAsync(User, scope, resolved, ct);
                if (!resolvedAccess.Allowed) return null;
              }
              """));
    }

    [Fact]
    public void Denial_must_consume_its_own_gate_result()
    {
        Assert.False(Recognized("""
              if (secureNowExchange) {
                var resolvedAccess = gate.AuthorizeAsync(User, scope, resolved, ct);
                if (!access.Allowed) return null;
              }
              """));
    }

}
