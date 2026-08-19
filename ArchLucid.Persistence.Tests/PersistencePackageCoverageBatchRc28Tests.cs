using System.Data;

using ArchLucid.Persistence.ArtifactBundles;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Sql;

using Dapper;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     RC28 package-coverage batch: Cosmos emulator HttpClient factory, chunked Dapper batch guards, and artifact
///     bundle trace JSON reader.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatchRc28Tests
{
    [Fact]
    public void CosmosEmulatorHttpClientFactory_Create_returns_usable_client()
    {
        using HttpClient client = CosmosEmulatorHttpClientFactory.Create();

        client.Should().NotBeNull();
    }

    [Fact]
    public async Task SqlChunkedDapperBatch_ExecuteChunksAsync_noops_for_non_positive_count()
    {
        Mock<IDbConnection> connection = new();
        int builds = 0;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection.Object,
            transaction: null,
            totalCount: 0,
            maxRowsPerCommand: SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            buildChunk: (_, _) =>
            {
                builds++;

                return new SqlChunkedBatchCommand("SELECT 1", new DynamicParameters());
            },
            CancellationToken.None);

        builds.Should().Be(0);
        connection.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SqlChunkedDapperBatch_ExecuteChunksAsync_rejects_invalid_args()
    {
        Mock<IDbConnection> connection = new();

        await FluentActions
            .Invoking(() => SqlChunkedDapperBatch.ExecuteChunksAsync(
                null!,
                null,
                1,
                10,
                (_, _) => new SqlChunkedBatchCommand("SELECT 1", new DynamicParameters()),
                CancellationToken.None))
            .Should()
            .ThrowAsync<ArgumentNullException>();

        await FluentActions
            .Invoking(() => SqlChunkedDapperBatch.ExecuteChunksAsync(
                connection.Object,
                null,
                1,
                10,
                null!,
                CancellationToken.None))
            .Should()
            .ThrowAsync<ArgumentNullException>();

        await FluentActions
            .Invoking(() => SqlChunkedDapperBatch.ExecuteChunksAsync(
                connection.Object,
                null,
                1,
                0,
                (_, _) => new SqlChunkedBatchCommand("SELECT 1", new DynamicParameters()),
                CancellationToken.None))
            .Should()
            .ThrowAsync<ArgumentOutOfRangeException>()
            .WithParameterName("maxRowsPerCommand");
    }

    [Fact]
    public void ArtifactBundleTraceJsonReader_DeserializeTraceBase_blank_returns_default_trace()
    {
        SynthesisTrace blank = ArtifactBundleTraceJsonReader.DeserializeTraceBase(null);
        SynthesisTrace whitespace = ArtifactBundleTraceJsonReader.DeserializeTraceBase("   ");

        blank.Should().NotBeNull();
        whitespace.Should().NotBeNull();
    }

    [Fact]
    public void ArtifactBundleTraceJsonReader_DeserializeTraceBase_parses_json_object()
    {
        SynthesisTrace trace = ArtifactBundleTraceJsonReader.DeserializeTraceBase("{}");

        trace.Should().NotBeNull();
    }
}
