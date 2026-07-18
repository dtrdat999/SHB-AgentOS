# sitecustomize.py — Automatically loaded by Python before any code runs.
# This file fixes Vietnamese character encoding on Windows.
# Place this file in the project root directory.
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass  # Python < 3.7 or non-text stream — skip safely
