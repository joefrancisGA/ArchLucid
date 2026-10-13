"""Appendix A: the pay-reconcile function, run offline against stand-ins for the Azure SDKs."""

from __future__ import annotations

import importlib
import os
import sys
import types
import unittest
from unittest import mock

import support  # noqa: F401


class FakeBlob:
    def __init__(self, name: str) -> None:
        self.name = name


class FakeContainer:
    def __init__(self, name: str) -> None:
        self.name = name

    def list_blobs(self) -> list[FakeBlob]:
        return [FakeBlob("2026-10-01.csv"), FakeBlob("2026-10-02.csv")]


class FakeBlobServiceClient:
    instances: list["FakeBlobServiceClient"] = []

    def __init__(self, account_url: str, credential: object) -> None:
        self.account_url = account_url
        self.credential = credential
        self.containers: list[str] = []
        FakeBlobServiceClient.instances.append(self)

    def get_container_client(self, name: str) -> FakeContainer:
        self.containers.append(name)

        return FakeContainer(name)


class FakeCredential:
    def __init__(self, client_id: str) -> None:
        self.client_id = client_id


class FakeResponse:
    def __init__(self, body: str) -> None:
        self.body = body


class FakeFunctionApp:
    def __init__(self, http_auth_level: str) -> None:
        self.http_auth_level = http_auth_level
        self.routes: dict[str, object] = {}

    def route(self, route: str):
        def register(handler: object) -> object:
            self.routes[route] = handler

            return handler

        return register


def fake_azure_modules() -> dict[str, types.ModuleType]:
    functions = types.ModuleType("azure.functions")
    functions.FunctionApp = FakeFunctionApp
    functions.AuthLevel = types.SimpleNamespace(FUNCTION="function")
    functions.HttpRequest = object
    functions.HttpResponse = FakeResponse
    identity = types.ModuleType("azure.identity")
    identity.ManagedIdentityCredential = FakeCredential
    blob = types.ModuleType("azure.storage.blob")
    blob.BlobServiceClient = FakeBlobServiceClient

    return {
        "azure": types.ModuleType("azure"),
        "azure.functions": functions,
        "azure.identity": identity,
        "azure.storage": types.ModuleType("azure.storage"),
        "azure.storage.blob": blob,
    }


class Reconcile(unittest.TestCase):
    def setUp(self) -> None:
        FakeBlobServiceClient.instances.clear()

        with mock.patch.dict(sys.modules, fake_azure_modules()):
            sys.modules.pop("appa_function_app", None)
            self.module = importlib.import_module("appa_function_app")

        sys.modules.pop("appa_function_app", None)

    def test_function_level_auth_and_route(self) -> None:
        self.assertEqual(self.module.app.http_auth_level, "function")
        self.assertIs(self.module.app.routes["reconcile"], self.module.reconcile)

    def test_lists_settlements_with_the_attached_identity(self) -> None:
        settings = {"ARCHIVE_ACCOUNT": "custarchive", "AZURE_CLIENT_ID": "client-123"}

        with mock.patch.dict(os.environ, settings):
            response = self.module.reconcile(object())

        client = FakeBlobServiceClient.instances[0]
        self.assertEqual(response.body, "2 settlement files")
        self.assertEqual(client.account_url, "https://custarchive.blob.core.windows.net")
        self.assertEqual(client.credential.client_id, "client-123")
        self.assertEqual(client.containers, ["settlements"])

    def test_missing_setting_fails_loudly(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True), self.assertRaises(KeyError):
            self.module.reconcile(object())


if __name__ == "__main__":
    unittest.main()
