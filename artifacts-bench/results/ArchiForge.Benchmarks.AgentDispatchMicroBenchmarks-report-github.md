```

BenchmarkDotNet v0.14.0, Windows 11 (10.0.26200.8037)
11th Gen Intel Core i5-1135G7 2.40GHz, 1 CPU, 8 logical and 4 physical cores
.NET SDK 10.0.201
  [Host]   : .NET 10.0.5 (10.0.526.15411), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI
  ShortRun : .NET 10.0.5 (10.0.526.15411), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI

Job=ShortRun  IterationCount=3  LaunchCount=1  
WarmupCount=3  

```
| Method                  | Mean     | Error    | StdDev  | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|------------------------ |---------:|---------:|--------:|------:|--------:|-------:|----------:|------------:|
| OrderTasksByDispatchKey | 151.3 ns | 157.0 ns | 8.61 ns |  1.00 |    0.07 | 0.0994 |     416 B |        1.00 |
