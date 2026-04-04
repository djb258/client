"""
CTB Metadata
ctb_id: CTB-F440ABB78F5F
ctb_branch: ui
ctb_path: ui/src/server/blueprints/versioning.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:02.060372
checksum: 7ab2dc21
"""

import json, hashlib

OMIT = {"timestamp_last_touched", "_created_at_ms", "blueprint_version_hash"}

def _scrub(o):
    if isinstance(o, dict):
        return {k: _scrub(v) for k, v in sorted(o.items()) if k not in OMIT}
    if isinstance(o, list):
        return [_scrub(v) for v in o]
    return o

def canonicalize(ssot: dict) -> str:
    return json.dumps(_scrub(ssot), separators=(",", ":"), sort_keys=True)

def stamp_version_hash(ssot: dict) -> dict:
    canon = canonicalize(ssot)
    h = hashlib.sha256(canon.encode("utf-8")).hexdigest()
    ssot = dict(ssot)
    doctrine = dict(ssot.get("doctrine") or {})
    doctrine["blueprint_version_hash"] = h
    ssot["doctrine"] = doctrine
    return ssot