# Design change #3 — bounded validation increment

This deliberately small first increment reuses the existing `FindingJsonNumericReaders` and `FindingJsonDateReaders` instead of adding a competing validation framework.

## Defect and fix
Untrusted `reviewedAtUtc` values may be provided as numeric Unix milliseconds or numeric strings. The existing date reader called `DateTimeOffset.FromUnixTimeMilliseconds` directly after a successful Int64 parse; values outside the DateTimeOffset range threw `ArgumentOutOfRangeException` despite the `TryRead` contract. Both paths now share a bounded conversion returning false for out-of-range values. Existing finding converter behavior then leaves the optional review date unset.

## Tests and rollout
Three parameterized converter regression cases cover positive/negative Int64 extremes and numeric strings. Targeted command:

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter FullyQualifiedName~Deserialize_out_of_range_reviewedAtUtc --configuration Release
```

No database, schema, public API, or RC48/Aspects workflow changes. Do not claim validation until the .NET job executes. Future candidate migrations: external numeric identifier parsing and other date readers, each only when a real duplicated boundary and regression case is established.
