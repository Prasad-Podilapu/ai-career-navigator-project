# Setup on Another System

## Recommended Python Version

Use Python `3.11` or `3.12` for the smoothest setup.

## 1. Create and activate a virtual environment

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 2. Install packages

```bash
pip install -r requirements.txt
```

## 3. Install the spaCy English model

```bash
python -m spacy download en_core_web_sm
```

## 4. Run Django migrations

```bash
python manage.py migrate
```

## 5. Start the project

### Root project

```bash
python manage.py runserver
```

### Nested `career_ai` project

```bash
cd career_ai
python manage.py runserver
```

## Notes

- `sentence-transformers` is used for stronger semantic matching.
- If `sentence-transformers` or `spacy` is missing, the app can still run with fallback analysis logic, but results will be less advanced.
- `pypdf` is needed for PDF resume uploads.
- `python-docx` is needed for DOCX uploads and ATS resume DOCX download.
- `Chart.js` is loaded from CDN in the browser, so no `npm` or frontend build step is required for the current project.
- The first run of the semantic model may download the `all-MiniLM-L6-v2` model automatically.
