# Risk & Tradeoffs — Step 2: WAF Tradeoff Catalog

## Context

Implement the Azure Well-Architected Framework tradeoff catalog described in
`docs/architecture/analyzer_component.md` §3.4–§3.5 (rev 7). This is a bounded,
versioned data file (≤20 directed pillar pairs) plus a typed loader. It is the
only detection input the engine needs; it is also read in reverse to generate
closed-form counterfactuals (§6).

## Design rules

- The catalog is **data, not code**. Define entries in a JSON file; load at
  startup via a singleton. Do not encode catalog entries as switch-cases or
  hardcoded strings in the detection engine.
- **Exactly 20 directed pairs maximum** — do not grow it into a checklist.
- Each entry carries:
  - `gainedPillar` / `sacrificedPillar` (match `WafPillar` enum values)
  - `mechanismKey` — stable, lowercase, hyphenated identifier (e.g.
    `"cost-reliability/single-region"`). This is the value stored on
    `ArchitectureTradeoff.Mechanism`.
  - `mechanismLabel` — human-readable display name
  - `detectionSignatures` — list of strings/patterns the engine looks for in
    `ManifestDocument` sections to identify this tradeoff (manifest section name,
    field path, or keyword list)
  - `counterfactualKey` — key of the inverse entry that describes what would
    satisfy the sacrificed pillar (used by §6 counterfactual generation)
  - `defaultConsequence` — `"Low"` | `"Medium"` | `"High"`
  - `defaultReversibility` — `"Reversible"` | `"Costly"` | `"OneWayDoor"`

## Seed entries (from design doc §3.4 — implement all 6 at minimum)

| Gained → Sacrificed | Mechanism key | Detection signature hints |
|---------------------|---------------|---------------------------|
| Cost → Reliability | `cost-reliability/single-region` | single region App Service / no secondary region |
| Cost → Performance | `cost-performance/scale-to-zero` | scale-to-zero / consumption plan |
| Security → Performance | `security-performance/private-endpoints` | private endpoints / service endpoints everywhere |
| Security → Operations | `security-operations/controls-friction` | MFA / conditional access / elevated control count |
| Performance → Reliability | `performance-reliability/caching` | Redis cache / CDN / denormalization |
| Reliability → Cost | `reliability-cost/multi-region` | active-active / geo-redundant / multi-region write |

Add the obvious inverses (e.g. `reliability-cost/multi-region` is the counterfactual
for `cost-reliability/single-region`).

## What to build

### Data file

`ArchLucid.KnowledgeGraph/Data/WafTradeoffCatalog.json`

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "mechanismKey": "cost-reliability/single-region",
      "mechanismLabel": "Single region to reduce cost",
      "gainedPillar": "Cost",
      "sacrificedPillar": "Reliability",
      "detectionSignatures": ["single-region", "no secondary region", "single App Service region"],
      "counterfactualKey": "reliability-cost/multi-region",
      "defaultConsequence": "High",
      "defaultReversibility": "Costly"
    }
    // ... remaining entries
  ]
}
```

### Typed model

`ArchLucid.KnowledgeGraph/WafTradeoff/WafTradeoffCatalogEntry.cs`

```csharp
public sealed class WafTradeoffCatalogEntry
{
    public string MechanismKey { get; set; } = null!;
    public string MechanismLabel { get; set; } = null!;
    public WafPillar GainedPillar { get; set; }
    public WafPillar SacrificedPillar { get; set; }
    public List<string> DetectionSignatures { get; set; } = [];
    public string? CounterfactualKey { get; set; }
    public RiskConsequence DefaultConsequence { get; set; }
    public ReversibilityClass DefaultReversibility { get; set; }
}
```

### Loader interface + implementation

`IWafTradeoffCatalog` with:
- `IReadOnlyList<WafTradeoffCatalogEntry> All { get; }`
- `WafTradeoffCatalogEntry? FindByKey(string mechanismKey)`
- `WafTradeoffCatalogEntry? FindCounterfactual(string mechanismKey)` — looks up `CounterfactualKey`

`WafTradeoffCatalog` (singleton) reads from the embedded JSON file at startup
and caches in memory. Register as `IWafTradeoffCatalog` singleton in DI.

## Guardrails

- The JSON file is embedded resource (`<EmbeddedResource>`) — no file-system
  path dependency at runtime.
- The loader throws on startup if any `counterfactualKey` references a
  `mechanismKey` that does not exist in the catalog.
- `DetectionSignatures` strings are lowercase; comparison in the engine is
  case-insensitive.
- Follow the pattern of existing data files in `ArchLucid.KnowledgeGraph/Data/`
  if any exist.

## Acceptance criteria

- JSON file has ≥6 entries covering all §3.4 seed pairs plus their inverses.
- `IWafTradeoffCatalog` compiles and resolves from DI in `ArchLucid.Api`.
- Unit tests:
  - `FindByKey` returns correct entry for each seed pair.
  - `FindCounterfactual("cost-reliability/single-region")` returns the
    `reliability-cost/multi-region` entry.
  - Startup throws if catalog is malformed (missing counterfactual reference).
