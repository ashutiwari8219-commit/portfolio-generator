"""
AI Portfolio Generator — backend.

Serves the builder UI and renders a self-contained, downloadable
portfolio HTML file from the data submitted in the form.
"""
from __future__ import annotations

import re
from datetime import datetime

from flask import Flask, request, render_template, jsonify, Response

app = Flask(__name__)

THEMES = {"blueprint", "mono"}


def slugify(value: str) -> str:
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value or "portfolio"


def clean_list(items) -> list[str]:
    """Trim, drop empties, keep order, from a list of strings."""
    if not isinstance(items, list):
        return []
    out = []
    for item in items:
        if isinstance(item, str):
            item = item.strip()
            if item:
                out.append(item)
    return out


def clean_projects(items) -> list[dict]:
    if not isinstance(items, list):
        return []
    out = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = (item.get("name") or "").strip()
        if not name:
            continue
        out.append({
            "name": name,
            "description": (item.get("description") or "").strip(),
            "link": (item.get("link") or "").strip(),
            "tags": clean_list(item.get("tags", [])) if isinstance(item.get("tags"), list) else
                    clean_list((item.get("tags") or "").split(",")) if isinstance(item.get("tags"), str) else [],
        })
    return out


def normalize(data: dict) -> dict:
    theme = data.get("theme", "blueprint")
    if theme not in THEMES:
        theme = "blueprint"

    skills = data.get("skills", [])
    if isinstance(skills, str):
        skills = skills.split(",")
    skills = clean_list(skills)

    return {
        "name": (data.get("name") or "Your Name").strip(),
        "role": (data.get("role") or "").strip(),
        "bio": (data.get("bio") or "").strip(),
        "email": (data.get("email") or "").strip(),
        "github": (data.get("github") or "").strip(),
        "linkedin": (data.get("linkedin") or "").strip(),
        "website": (data.get("website") or "").strip(),
        "skills": skills,
        "projects": clean_projects(data.get("projects", [])),
        "theme": theme,
        "year": datetime.now().year,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    payload = request.get_json(silent=True) or {}
    data = normalize(payload)

    template_name = f"portfolio_{data['theme']}.html"
    html = render_template(template_name, **data)

    filename = f"{slugify(data['name'])}-portfolio.html"
    return Response(
        html,
        mimetype="text/html",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.route("/api/preview", methods=["POST"])
def preview():
    """Same render, but shown inline (used for the 'open in new tab' preview)."""
    payload = request.get_json(silent=True) or {}
    data = normalize(payload)
    template_name = f"portfolio_{data['theme']}.html"
    html = render_template(template_name, **data)
    return Response(html, mimetype="text/html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
