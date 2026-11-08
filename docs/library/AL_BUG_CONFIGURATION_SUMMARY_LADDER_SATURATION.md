> **Scope:** Contributor-reference — Internal configuration-summary saturation and reseed guidance; not customer-facing assurance.

# Configuration summary — saturated /al-bug reseed classes

Owner pivot **2026-10-29:** `core-configuration-summary` dry hunts **#658–#662** closed five `(candidate)` rows per run using **arithmetic sibling** inputs (3802–3806-layer `ClientSecret=` percent chains, 524–528 supplementary-char truncation boundaries, and alternating delimiter / JSON-null / uppercase-key re-verifies). Those mechanisms were already pinned; further siblings are **not hunt-ready**.

## Saturated classes (do not reseed or add per-integer tests)

| Class tag | Mechanism already pinned | Cheap-disproof without new test |
| --- | --- | --- |
| `[class:config-percent-decode-layer-ladder]` | `maxPercentDecodePasses` (33216) covers deep `ClientSecret=` percent chains | `(valid-no-repro)` — cite earliest `Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_*_layer_percent_encoded_in_query` regression |
| `[class:config-supplementary-truncation-ladder]` | Surrogate-safe 256-char scalar prefix before ellipsis | `(valid-no-repro)` — cite earliest `Resolve_truncates_scalar_without_splitting_*_supplementary_characters_at_boundary` regression |
| `[class:config-delimiter-reverify]` | Halfwidth hangul `U+FFA0` / `U+FFA1` pair delimiters | `(valid-no-repro)` — cite existing `*_pair_is_halfwidth_hangul_*_delimited` matrix test |
| `[class:config-json-null-property-reverify]` | Sensitive JSON property names with null values | `(valid-no-repro)` — cite existing `Resolve_redacts_json_object_effective_values_when_property_name_is_*_and_value_is_null` |
| `[class:config-uppercase-key-reverify]` | `OrdinalIgnoreCase` credential key names | `(valid-no-repro)` — cite existing `*_uses_uppercase_key_name` matrix test |

## Reseed instead (reachability required)

When `core-configuration-summary` reopens from `cooling`, seed from **workflow 1.1a** signal: sibling-path disagreement, recent `ArchLucid.Core/Configuration/` churn without tests, analyzer SARIF, surviving mutants — not the five classes above.

## CI

New per-integer test **method names** matching ladder patterns are blocked unless listed in `scripts/ci/al-bug-configuration-summary-ladder-test-allowlist.txt` (grandfather list). Prefer consolidated parameterized pins when adding new mechanism coverage.

## Zone status

`core-configuration-summary` is **`cooling`** until a hunt-ready row with reachability is promoted or production commits on `ArchLucid.Core/Configuration/` reopen high-yield hunting.
