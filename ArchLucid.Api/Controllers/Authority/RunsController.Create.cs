namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run creation endpoints and idempotency header handling.</summary>
public sealed partial class RunsController
{
    private const int BatchCreateRunMaxItems = 50;
}
