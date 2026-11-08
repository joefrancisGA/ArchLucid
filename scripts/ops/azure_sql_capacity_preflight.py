#!/usr/bin/env python3
"""Fail-closed preflight for an explicitly approved Azure SQL test benchmark."""
import argparse
import json
import os
import re
from pathlib import Path

RESOURCE = re.compile(r"^/subscriptions/[a-zA-Z0-9-]+/resourceGroups/[^/]+/providers/Microsoft\\.Sql/servers/[^/]+/databases/[^/]+$", re.I)

def validate(resource_id, database_name, approval, connection_string):
    if not RESOURCE.fullmatch(resource_id):
        raise ValueError("Expected an Azure SQL DATABASE ARM resource ID")
    if not database_name.startswith("ArchLucidCapacityTest_"):
        raise ValueError("Only dedicated ArchLucidCapacityTest_ databases are permitted")
    if resource_id.rsplit("/", 1)[-1].lower() != database_name.lower():
        raise ValueError("Connection target and approved Azure SQL resource do not match")
    if approval != "I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES":
        raise ValueError("Explicit benchmark authorization is required")
    if not connection_string:
        raise ValueError("Connection string must be supplied in environment")
    pieces = dict(piece.split("=",1) for piece in connection_string.split(";") if "=" in piece)
    catalog = next((v for k,v in pieces.items() if k.strip().lower() in ("database","initial catalog")), None)
    if catalog is None or catalog.strip().lower() != database_name.lower():
        raise ValueError("Database name in connection string does not match test resource")
    if any(k.strip().lower() in ("trustservercertificate","encrypt") and v.strip().lower() in ("true","false") and
           ((k.strip().lower()=="trustservercertificate" and v.strip().lower()=="true") or
            (k.strip().lower()=="encrypt" and v.strip().lower()=="false")) for k,v in pieces.items()):
        raise ValueError("TLS verification must not be disabled")
    return {"schemaVersion":1,"status":"PREFLIGHT_ONLY_NO_AZURE_ACCESS","resourceId":resource_id,
            "database":database_name,"limitations":"No network connection or workload executed; identity, exclusivity and resource state must still be verified."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--resource-id",required=True)
    p.add_argument("--database",required=True)
    p.add_argument("--approval",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    result=validate(a.resource_id,a.database,a.approval,os.environ.get("ARCHLUCID_AZURE_SQL_TEST_CONNECTION",""))
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2)+"\n")
if __name__=="__main__":
    main()
