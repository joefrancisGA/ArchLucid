@echo off
REM Legacy shim: delegates to test.cmd Slow. See docs/TEST_EXECUTION_MODEL.md.
REM Will be retired after 2026-Q3; new docs/runbooks should call test.cmd Slow directly.
setlocal
cd /d "%~dp0"
call "%~dp0test.cmd" Slow
exit /b %ERRORLEVEL%
