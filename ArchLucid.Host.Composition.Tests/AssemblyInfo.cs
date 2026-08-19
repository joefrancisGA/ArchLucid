using Xunit;

// Full composition resolve tests build large DI graphs with live Azure SDK clients; serial execution
// avoids parallel scope teardown races that wedge the testhost on CI (see CI run #2155).
[assembly: CollectionBehavior(MaxParallelThreads = 1)]
