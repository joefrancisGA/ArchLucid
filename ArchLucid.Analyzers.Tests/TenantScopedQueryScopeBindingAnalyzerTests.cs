using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class TenantScopedQueryScopeBindingAnalyzerTests
{
    private const string SharedStubs = """

namespace ArchLucid.Core.Tenancy
{
    public enum TenantScopeExemptReason
    {
        AcceptedResidual = 0,
        SystemPlaneOnly = 1,
        Operational = 2,
    }

    [System.AttributeUsage(System.AttributeTargets.Class | System.AttributeTargets.Method, Inherited = true)]
    public sealed class TenantScopeExemptAttribute : System.Attribute
    {
        public TenantScopeExemptAttribute(TenantScopeExemptReason reason, string justification) { }
    }
}

""";

    private const string RegistryJson = """
        {
          "scopeTripleOnRow": ["dbo.Runs"],
          "tenantIdOnRow": ["dbo.TenantSettings"]
        }
        """;

    [Fact]
    public async Task ARCH006b_reports_empty_exemption_justification()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Probe
{
using ArchLucid.Core.Tenancy;

[TenantScopeExempt(TenantScopeExemptReason.Operational, "")]
public sealed class BadExemptionRepository
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.EmptyExemptionJustificationRule)
            .WithSpan(22, 2, 22, 60)
            .WithArguments("ArchLucid.Persistence.Probe.BadExemptionRepository");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    private static async Task RunPersistenceAnalyzerTestAsync(
        string testCode,
        params DiagnosticResult[] expectedDiagnostics)
    {
        CSharpAnalyzerTest<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidPersistence },
            TestState =
            {
                AdditionalFiles =
                {
                    ("tenant_scoped_tables.v1.json", Microsoft.CodeAnalysis.Text.SourceText.From(RegistryJson)),
                },
            },
        };

        test.ExpectedDiagnostics.AddRange(expectedDiagnostics);

        await test.RunAsync();
    }

    private static Solution MarkAssemblyAsArchLucidPersistence(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Persistence");
}
