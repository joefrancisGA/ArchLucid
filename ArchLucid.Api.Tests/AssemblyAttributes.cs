// IntegrationTestSqlCatalogEnvironment mutates process-wide env vars; parallel collections race catalog pins (TB-881).
[assembly: CollectionBehavior(DisableTestParallelization = true)]
