import json
import os
import subprocess
import sys
from pathlib import Path

from flask import Flask, jsonify, request

app = Flask(__name__)


@app.post("/api/report")
def report():
    expected = os.environ.get("REPORT_INTERNAL_SECRET")
    if not expected or request.headers.get("x-report-secret") != expected:
        return jsonify({"error": "Unauthorized"}), 401

    script = Path(__file__).resolve().parent.parent / "scripts" / "project_report.py"
    process = subprocess.run(
        [sys.executable, str(script)],
        input=json.dumps(request.get_json(force=True)),
        text=True,
        capture_output=True,
        check=False,
    )
    if process.returncode:
        return jsonify({"error": process.stderr or "The reporting service could not generate this report."}), 500
    return app.response_class(process.stdout, mimetype="application/json")
