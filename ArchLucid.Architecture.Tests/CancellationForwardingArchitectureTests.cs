using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-008: public async boundaries accept and forward <see cref="CancellationToken"/> to I/O.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CancellationForwardingArchitectureTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void Architecture_run_execute_orchestrator_public_entrypoint_accepts_cancellation()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Application", "Runs", "Orchestration", "ArchitectureRunExecuteOrchestrator.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("ExecuteRunAsync(string runId, CancellationToken cancellationToken");
    }

    [Fact]
    public void Idempotency_filter_forwards_request_aborted_to_repository()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Api", "Controllers", "Authority", "IdempotencyFilterAttribute.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("context.HttpContext.RequestAborted");
        text.Should().Contain("TryGetAsync(scope.TenantId, idempotencyKey, context.HttpContext.RequestAborted");
        text.Should().Contain("TryInsertAsync(scope.TenantId, idempotencyKey");
    }

    [Fact]
    public void LlmTenantWalletService_public_methods_accept_cancellation()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Application", "Budgeting", "LlmTenantWalletService.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("GetWalletAsync(Guid tenantId, CancellationToken cancellationToken");
        text.Should().Contain(".ConfigureAwait(false)");
    }
}
