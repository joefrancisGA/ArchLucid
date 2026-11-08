"""Prevent stale procurement security narratives from contradicting ADR 0037."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8-sig")


def test_strid_sql_boundary_no_longer_claims_rls_as_a_production_control() -> None:
    text = read("docs/security/SYSTEM_THREAT_MODEL.md")
    rows = [line for line in text.splitlines() if line.startswith("| API → SQL |")]
    assert len(rows) == 1
    assert "Database-per-tenant catalogs" in rows[0]
    assert "verified tenant-to-catalog routing" in rows[0]
    assert "RLS + parameterized Dapper" not in rows[0]
    assert "RLS **" not in rows[0]
    assert "does **not** deploy SQL RLS" in text
    assert "0037-tenant-isolation-without-rls-defense-in-depth.md" in text


def test_security_overview_marks_rls_only_historical() -> None:
    text = read("docs/library/contributor-reference/SECURITY.md")
    assert "TENANT_ISOLATION_DEFENSE_IN_DEPTH.md" in text
    assert "0037-tenant-isolation-without-rls-defense-in-depth.md" in text
    assert "Historical RLS design (not an active control)" in text


def test_sig_external_pen_test_remains_deferred() -> None:
    text = read("docs/security/SIG_CORE_2026.md")
    row = next(line for line in text.splitlines() if line.startswith("| Third-party pen test |"))
    assert "Deferred" in row
    assert "no vendor engaged or test scheduled" in row
    assert "In flight" not in row


def test_index_owner_reaffirmation_not_external_attestation() -> None:
    text = read("docs/go-to-market/PROCUREMENT_PACK_INDEX.md")
    assert "Owner reaffirmation (2026-10-31 UTC; self-asserted)" in text
    assert "not independent control testing" in text
    assert "No CPA-issued SOC 2 report" in text
