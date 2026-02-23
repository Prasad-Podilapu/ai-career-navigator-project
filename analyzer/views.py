from sentence_transformers import SentenceTransformer, util
import spacy
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from PyPDF2 import PdfReader
import docx
import re

# -------------------------------
# Load AI models once (important for performance)
# -------------------------------
semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
nlp = spacy.load("en_core_web_sm")

# -------------------------------
# Text Cleaning (for semantic match)
# -------------------------------
def clean_text(text):
    doc = nlp(text.lower())
    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop and token.is_alpha
    ]
    return " ".join(tokens)

# -------------------------------
# Semantic Match (REAL AI)
# -------------------------------
def semantic_match(resume_text, job_text):
    resume_text = clean_text(resume_text)
    job_text = clean_text(job_text)

    embeddings = semantic_model.encode(
        [resume_text, job_text],
        convert_to_tensor=True
    )
    similarity = util.cos_sim(embeddings[0], embeddings[1])
    return float(similarity) * 100

# -------------------------------
# Skill List
# -------------------------------
SKILLS = [
    "python", "django", "flask",
    "java", "javascript",
    "html", "css",
    "sql", "mysql", "postgresql",
    "react", "node",
    "git", "github",
    "docker",
    "machine learning",
    "data science",
    "rest api", "api"
]

# -------------------------------
# Skill Extraction (FIXED – single version)
# -------------------------------
def extract_skills(text):
    text = text.lower()
    found = set()

    for skill in SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text):
            found.add(skill)

    return list(found)

# -------------------------------
# Page views
# -------------------------------
def home(request):
    return render(request, "analyzer/index.html")

def upload_page(request):
    return render(request, "analyzer/upload.html")

def result_page(request):
    return render(request, "analyzer/result.html")

# -------------------------------
# API: Resume Analysis
# -------------------------------
@csrf_exempt
def analyze_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    resume_file = request.FILES.get("resume")
    job_desc = request.POST.get("job_desc", "")

    if not resume_file or not job_desc:
        return JsonResponse(
            {"error": "Missing resume or job description"},
            status=400
        )

    # -------------------------
    # Read Resume (PDF / DOCX / TXT)
    # -------------------------
    resume_text = ""

    try:
        if resume_file.name.endswith(".pdf"):
            reader = PdfReader(resume_file)
            for page in reader.pages:
                resume_text += page.extract_text() or ""

        elif resume_file.name.endswith(".docx"):
            doc = docx.Document(resume_file)
            for para in doc.paragraphs:
                resume_text += para.text + " "

        else:  # TXT
            resume_text = resume_file.read().decode(errors="ignore")

    except Exception as e:
        return JsonResponse(
            {"error": "Could not read resume file"},
            status=400
        )

    # -------------------------
    # Semantic Match (REAL AI SCORE)
    # -------------------------
    match_percent = semantic_match(resume_text, job_desc)

    # -------------------------
    # Skill Matching
    # -------------------------
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_desc)

    matched_skills = list(set(resume_skills) & set(job_skills))
    missing_skills = list(set(job_skills) - set(resume_skills))

    # -------------------------
    # Summary Logic
    # -------------------------
    if match_percent >= 75:
        summary = "Excellent match! You are well aligned with this role."
    elif match_percent >= 40:
        summary = "Moderate match. Upskilling in a few areas will help."
    else:
        summary = "Low match. Consider learning key skills before applying."

    # -------------------------
    # Roadmap Generator
    # -------------------------
    roadmap = [
        f"Learn {skill}: basics → practice → mini project → add to resume"
        for skill in missing_skills
    ]
    # -------------------------
# Strengths & Improvements
# -------------------------
    strengths = []
    improvements = []

    for skill in matched_skills:
        strengths.append(f"Strong knowledge of {skill}")

    for skill in missing_skills:
        improvements.append(f"Improve your {skill} skills to match job requirements")

    return JsonResponse({
    "summary": summary,
    "match_percent": round(match_percent, 2),
    "matched_skills": matched_skills,
    "missing_skills": missing_skills,
    "roadmap": roadmap,
    "strengths": strengths,
    "improvements": improvements
})
