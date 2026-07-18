# AI Portfolio Generator

A small web app for drafting a personal portfolio site. Fill in a form,
watch a live "blueprint" preview update as you type, then generate a
single self-contained HTML file you can host anywhere (GitHub Pages,
Netlify, a plain server, whatever).

## Stack

- **Backend:** Python + Flask (`app.py`), Jinja2 templates
- **Frontend:** plain HTML/CSS/JS (`templates/index.html`, `static/`)
- No build step, no database — everything runs from these files.

## Run it locally

```bash
cd portfolio-generator
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000**.

## How it works

- `templates/index.html` + `static/css/style.css` + `static/js/script.js`
  render the builder UI: a form on the left, a live preview on the right.
  The preview updates purely in the browser (no server round-trip) as you
  type.
- When you click **Generate & download**, the frontend sends your form
  data as JSON to `POST /api/generate`. The Flask backend fills in one of
  two Jinja2 templates (`templates/portfolio_blueprint.html` or
  `templates/portfolio_mono.html`) and returns the finished page as a
  downloadable `.html` file — fonts and CSS are inlined, so the file
  works standalone, no server required.
- **Open preview ↗** does the same render but returns it inline
  (`POST /api/preview`) so you can check it in a new tab before
  downloading.

## Project structure

```
portfolio-generator/
├── app.py                          # Flask app + routes
├── requirements.txt
├── templates/
│   ├── index.html                  # builder UI
│   ├── portfolio_blueprint.html    # output theme 1
│   └── portfolio_mono.html         # output theme 2
└── static/
    ├── css/style.css               # builder UI styling
    └── js/script.js                # builder UI behavior
```

## Extending it

- **Add a theme:** drop a new `templates/portfolio_<name>.html` file and
  add `<name>` to `THEMES` in `app.py`, then add a radio option in
  `index.html`'s theme picker.
- **AI-written bio/copy:** the form's bio field is plain text today. To
  have Claude draft or polish it, add a route that calls the Anthropic
  API (`anthropic` Python SDK) with the user's rough notes and return the
  generated text to fill the field — that keeps your API key server-side
  rather than exposed in the browser.
