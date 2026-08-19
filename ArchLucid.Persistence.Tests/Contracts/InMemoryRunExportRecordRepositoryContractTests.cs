using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryRunExportRecordRepositoryContractTests : RunExportRecordRepositoryContractTests
{
    protected override IRunExportRecordRepository CreateRepository()
    {
        return new InMemoryRunExportRecordRepository();
    }
}
