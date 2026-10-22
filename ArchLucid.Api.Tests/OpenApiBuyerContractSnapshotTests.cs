using System.Text.Json.Nodes;

using ArchLucid.Api.Tests.Contracts;

using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Fails when buyer-tier OpenAPI drifts from <c>Contracts/buyer-contract.openapi.snapshot.json</c> (TB-286).
/// </summary>
[Trait("Suite", "Core")]
public sealed class OpenApiBuyerContractSnapshotTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    private const string OpenApiDocumentPath = "/openapi/v1.json";
    private const string SnapshotFileName = "buyer-contract.openapi.snapshot.json";

    [SkippableFact]
    public async Task Buyer_contract_openapi_matches_committed_snapshot()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync(OpenApiDocumentPath);
        await response.EnsureSuccessForTestAsync();
        string actual = await response.Content.ReadAsStringAsync();
        JsonNode? actualNode = JsonNode.Parse(actual);
        Assert.NotNull(actualNode);

        JsonNode canonical = OpenApiJsonCanonicalizer.Canonicalize(actualNode);
        JsonNode buyerContract = OpenApiBuyerContractFilter.FilterToBuyerContract(canonical);

        OpenApiBuyerContractFilter.ContainsInternalPaths(buyerContract).Should().BeFalse(
            "buyer contract snapshot must not include /v1/internal/ paths.");

        if (string.Equals(
                Environment.GetEnvironmentVariable("ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT"),
                "1",
                StringComparison.Ordinal))
        {
            string path = ResolveSourceSnapshotPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            string normalized = OpenApiJsonCanonicalizer.SerializeIndented(buyerContract);
            await File.WriteAllTextAsync(path, normalized);
            return;
        }

        string snapshotOnDisk = Path.Combine(AppContext.BaseDirectory, "Contracts", SnapshotFileName);
        Assert.True(
            File.Exists(snapshotOnDisk),
            $"Missing snapshot at {snapshotOnDisk}. Run once with ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT=1.");

        string expectedJson = await File.ReadAllTextAsync(snapshotOnDisk);
        JsonNode? expectedNode = JsonNode.Parse(expectedJson);
        Assert.NotNull(expectedNode);

        if (!JsonNode.DeepEquals(buyerContract, expectedNode))
        {
            Assert.Fail(
                """
                Buyer-tier OpenAPI does not match buyer-contract.openapi.snapshot.json.
                Regenerate intentionally:
                  ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT=1 dotnet test --filter OpenApiBuyerContractSnapshotTests
                """);
        }
    }

    private static string ResolveSourceSnapshotPath()
    {
        string assemblyFile = typeof(OpenApiBuyerContractSnapshotTests).Assembly.Location;
        string? dir = Path.GetDirectoryName(assemblyFile);

        for (int i = 0;
             i < TestRepositoryPathLimits.MaxStepsFromTestAssemblyBinToProjectOrContracts && dir is not null;
             i++)
        {
            string csproj = Path.Combine(dir, "ArchLucid.Api.Tests.csproj");

            if (File.Exists(csproj))
                return Path.Combine(dir, "Contracts", SnapshotFileName);

            dir = Directory.GetParent(dir)?.FullName;
        }

        throw new InvalidOperationException("Cannot find ArchLucid.Api.Tests.csproj for buyer OpenAPI snapshot path.");
    }
}
