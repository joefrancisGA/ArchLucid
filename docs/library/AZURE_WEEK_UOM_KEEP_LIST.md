> **Scope:** Contributor-reference — Azure Retail Prices unit-of-measure keep list for extractor cost hygiene (ABQ-47).

# Azure week UOM keep list (ABQ-47)

Authoritative inventory for ABQ-48/49 cleanup. Azure Retail Prices `unitOfMeasure`
values are short quantity+unit tokens (`1 Week`, `1/Week`, `wk`). Unbounded `week`+`k`
letter runs are synthetic hunt inputs, not catalog parity.

Historical `(proven)` ledger rows that cite deleted test class names are **not** rewritten.

CI ban: `scripts/ci/al-bug-ban-retired-classes.py` (week-uom-synonym checks).

## Keep (production)

| Method | Token / shape | Why |
| --- | --- | --- |
| `ContainsSlashWeekToken` | `ContainsSlashWeekToken` | Finite Azure-plausible week meter |
| `ContainsSlashWeeksToken` | `ContainsSlashWeeksToken` | Finite Azure-plausible week meter |
| `ContainsSlashWkToken` | `ContainsSlashWkToken` | Finite Azure-plausible week meter |
| `ContainsSlashWksToken` | `ContainsSlashWksToken` | Finite Azure-plausible week meter |
| `ContainsSpacedSlashWekToken` | ` / wek` | Finite Azure-plausible week meter |
| `ContainsSpacedSlashWeksToken` | ` / weks` | Finite Azure-plausible week meter |
| `ContainsSpacedSlashWelToken` | ` / wel` | Finite Azure-plausible week meter |
| `ContainsWeekWordToken` | `ContainsWeekWordToken` | Finite Azure-plausible week meter |
| `HasCompactWeekSuffix` | `week` | Finite Azure-plausible week meter |
| `HasCompactWeekWordSuffix` | `weekword` | Finite Azure-plausible week meter |
| `HasCompactWeekesSuffix` | `weekes` | Finite Azure-plausible week meter |
| `HasCompactWeeksWordSuffix` | `weeksword` | Finite Azure-plausible week meter |
| `HasCompactWekSuffix` | `wek` | Finite Azure-plausible week meter |
| `HasCompactWekksSuffix` | `wekks` | Finite Azure-plausible week meter |
| `HasCompactWeksSuffix` | `weks` | Finite Azure-plausible week meter |
| `HasCompactWelSuffix` | `wel` | Finite Azure-plausible week meter |
| `HasCompactWelsSuffix` | `wels` | Finite Azure-plausible week meter |
| `HasCompactWkSuffix` | `wk` | Finite Azure-plausible week meter |
| `HasCompactWksSuffix` | `wks` | Finite Azure-plausible week meter |

## Delete (production)

| Method | Token / shape | Rule |
| --- | --- | --- |
| `ContainsSpacedSlashWeeeeekToken` | ` / weeeeek` | extra-vowel farm beyond keep-list |
| `ContainsSpacedSlashWeeeksToken` | ` / weeeks` | extra-vowel farm beyond keep-list |
| `ContainsSpacedSlashWeekkToken` | ` / weekk` | `week` + 1 extra `k` |
| `ContainsSpacedSlashWeekkkkToken` | ` / weekkkk` | `week` + 3 extra `k` |
| `ContainsSpacedSlashWeekkkkkToken` | ` / weekkkkk` | `week` + 4 extra `k` |
| `ContainsSpacedSlashWeekkkkkkToken` | ` / weekkkkkk` | `week` + 5 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkToken` | ` / weekkkkkkk` | `week` + 6 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkToken` | ` / weekkkkkkkk` | `week` + 7 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkToken` | ` / weekkkkkkkkk` | `week` + 8 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkToken` | ` / weekkkkkkkkkk` | `week` + 9 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkToken` | ` / weekkkkkkkkkkk` | `week` + 10 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkk` | `week` + 11 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkk` | `week` + 12 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkk` | `week` + 13 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkk` | `week` + 14 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkk` | `week` + 15 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkk` | `week` + 16 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkk` | `week` + 17 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkk` | `week` + 18 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkk` | `week` + 19 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkk` | `week` + 20 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkk` | `week` + 21 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkk` | `week` + 22 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 23 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 24 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 25 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 26 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 27 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 28 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 29 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 30 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 31 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 32 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 33 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 34 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 35 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 36 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 37 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 38 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 39 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 40 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 41 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 42 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 43 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 44 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 45 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 46 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 47 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 48 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 49 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 50 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 51 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 52 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 56 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 57 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 58 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 59 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 60 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 61 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 62 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 63 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 64 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 65 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 66 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 67 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 68 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 69 extra `k` |
| `ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken` | ` / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 70 extra `k` |
| `HasCompactWeeeeekSuffix` | `weeeeek` | extra-vowel farm beyond keep-list |
| `HasCompactWeeeekSuffix` | `weeeek` | extra-vowel farm beyond keep-list |
| `HasCompactWeeeksSuffix` | `weeeks` | extra-vowel farm beyond keep-list |
| `HasCompactWeekkSuffix` | `weekk` | `week` + 1 extra `k` |
| `HasCompactWeekkkSuffix` | `weekkk` | `week` + 2 extra `k` |
| `HasCompactWeekkkkSuffix` | `weekkkk` | `week` + 3 extra `k` |
| `HasCompactWeekkkkkSuffix` | `weekkkkk` | `week` + 4 extra `k` |
| `HasCompactWeekkkkkkSuffix` | `weekkkkkk` | `week` + 5 extra `k` |
| `HasCompactWeekkkkkkkSuffix` | `weekkkkkkk` | `week` + 6 extra `k` |
| `HasCompactWeekkkkkkkkSuffix` | `weekkkkkkkk` | `week` + 7 extra `k` |
| `HasCompactWeekkkkkkkkkSuffix` | `weekkkkkkkkk` | `week` + 8 extra `k` |
| `HasCompactWeekkkkkkkkkkSuffix` | `weekkkkkkkkkk` | `week` + 9 extra `k` |
| `HasCompactWeekkkkkkkkkkkSuffix` | `weekkkkkkkkkkk` | `week` + 10 extra `k` |
| `HasCompactWeekkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkk` | `week` + 11 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkk` | `week` + 12 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkk` | `week` + 13 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkk` | `week` + 14 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkk` | `week` + 15 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkk` | `week` + 16 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkk` | `week` + 17 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkk` | `week` + 18 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkk` | `week` + 19 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkk` | `week` + 20 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkk` | `week` + 21 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkk` | `week` + 22 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 23 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 24 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 25 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 26 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 27 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 28 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 29 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 30 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 31 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 32 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 33 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 34 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 35 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 36 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 37 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 38 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 39 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 40 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 41 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 42 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 43 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 44 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 45 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 46 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 47 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 48 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 49 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 50 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 51 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 52 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 53 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 54 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 61 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 62 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 63 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 64 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 65 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 66 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 67 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 68 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 69 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 70 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 71 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 72 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 73 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 74 extra `k` |
| `HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix` | `weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk` | `week` + 75 extra `k` |

**Counts:** keep 19 methods; delete 140 methods.

## Keep (tests)

- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedDTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedDyTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMiTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMisTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMnTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMoTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedMosTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedWeekesTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedWelsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactDTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactDayTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactDaysWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactDyTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactHTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactHourWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactHoursWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactHrTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactHrsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMiTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMinTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMinsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMinuteWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMinutesWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMisTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMnTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMoTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMonTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMonthWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMonthsWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactMosTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekesTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeelsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWekksTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWelTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWelsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersGovernmentTierTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersHrsFalsePositiveTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersMinuteTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersNonMonthlyTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersReservationTypeTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashDayTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashDaysTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashDyTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashHourWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashHrsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMiTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMinsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMinuteWordTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMisTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMnTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMonTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMonthShortTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMonthsTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSlashMosTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWelTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneDayTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneDyTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneHourTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMiTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMisTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMnTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMonTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMonthTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersStandaloneMosTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekMeterTests.cs`

## Delete (tests)

- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeeeeekTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeeeekTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeeeksTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersCompactWeekkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeeeeekTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeeeksTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkTests.cs`

**Counts:** keep 68 test files; delete 140 test files.
