---
name: archlucid-ci-assertion-script
description: >-
  Implements or extends Python CI guard scripts under scripts/ci/ with unittest
  harness and GitHub Actions wiring. Use when adding repo assertions, doc checks,
  pricing guards, or mirroring patterns like assert_docs_root_size.py.
disable-model-invocation: true
---

# ArchLucid CI assertion script

## Layout

| Path | Role |
|------|------|
| `scripts/ci/<name>.py` | Entry script: argparse, non-zero exit on failure |
| `scripts/ci/tests/test_<name>.py` | `unittest` invoking the script via `subprocess` |
| [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) | Run script + optional unittest discover (existing pattern) |

## Script skeleton (`scripts/ci/`)

- **`from __future__ import annotations`**
- **`repo_root()`:** `Path(__file__).resolve().parents[2]` (two parents up from `scripts/ci/foo.py` to repo root).
- Use **`argparse`** for flags (`--max`, `--docs-dir`, etc.); default paths relative to `repo_root()`.
- **`main() -> int`:** return **0** on success, **1** on failure; print actionable messages to **stderr** on failure.
- **`if __name__ == "__main__": raise SystemExit(main())`**

Reference: [`scripts/ci/assert_docs_root_size.py`](../../../scripts/ci/assert_docs_root_size.py).

## Unit test skeleton (`scripts/ci/tests/`)

- **`unittest.TestCase`** or method names `test_*`.
- Resolve repo root: `Path(__file__).resolve().parents[3]` (three levels up from `scripts/ci/tests/test_foo.py`).
- Run script: `subprocess.run([sys.executable, str(script_path)], cwd=repo_root, capture_output=True, text=True, check=False)`.
- Assert `returncode == 0` for happy path; use **`tempfile.TemporaryDirectory()`** for negative tests.

Reference: [`scripts/ci/tests/test_assert_contributor_on_one_page_size.py`](../../../scripts/ci/tests/test_assert_contributor_on_one_page_size.py).

[`scripts/ci/tests/conftest.py`](../../../scripts/ci/tests/conftest.py) adds `scripts/ci` to `sys.path` for imports when needed.

## CI wiring

In [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml), copy the nearest similar step:

1. `python scripts/ci/<name>.py` (with args if required).
2. Optionally: `python -m unittest discover -s scripts/ci/tests -p "test_<name>.py"`.

Keep step order consistent with dependencies (e.g. doc guards after generated artifacts if applicable).

## Local verification

```bash
python scripts/ci/<name>.py
python -m unittest discover -s scripts/ci/tests -p "test_<name>.py"
```

## Do not

- Use Windows backslashes in skill or script help text paths (use forward slashes in docs: `scripts/ci/foo.py`).
