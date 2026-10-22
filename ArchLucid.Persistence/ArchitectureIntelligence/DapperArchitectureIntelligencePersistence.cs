using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.ArchitectureIntelligence;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class DapperArchitectureIntelligencePersistence : IArchitectureIntelligencePersistence
{
    private const string BlobContainerName = "architecture-intelligence";
    private const int InlineContentThresholdBytes = 256 * 1024;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ISqlConnectionFactory _connectionFactory;
    private readonly IArtifactBlobStore? _blobStore;

    public DapperArchitectureIntelligencePersistence(
        ISqlConnectionFactory connectionFactory,
        IArtifactBlobStore? blobStore = null)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _blobStore = blobStore;
    }

    private static string ComputeSha256Hex(byte[] content)
    {
        byte[] hash = SHA256.HashData(content);

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
