using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlAzureExtractorPackageRepository(ISqlConnectionFactory connectionFactory)
    : IAzureExtractorPackageRepository;
