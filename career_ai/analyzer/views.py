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

    # Programming Languages
    "python", "java", "c", "c++", "c#", "javascript", "typescript",

    # Web Technologies
    "html", "css", "bootstrap", "tailwind",
    "react", "angular", "vue",
    "node", "express",
    "django", "flask", "fastapi",
    "spring", "spring boot",

    # Databases
    "sql", "mysql", "postgresql", "mongodb", "sqlite",

    # Tools & DevOps
    "git", "github", "docker", "kubernetes",
    "aws", "azure", "gcp",
    "linux", "ci/cd", "jenkins",

    # Data & AI
    "machine learning", "deep learning",
    "data science", "pandas", "numpy",
    "tensorflow", "pytorch",

    # Concepts
    "rest api", "api",
    "oop", "data structures",
    "algorithms", "problem solving"
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
def detect_profile_level(text):
    text = text.lower()

    if "m.tech" in text or "masters" in text:
        return "Postgraduate"
    elif "b.tech" in text or "bachelor of technology" in text:
        return "Undergraduate (Engineering)"
    elif "b.sc" in text or "bachelor of science" in text:
        return "Undergraduate (Science)"
    elif "intern" in text:
        return "Student / Intern"
    else:
        return "General Candidate"
    
#-------------------------------
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

    profile_level = detect_profile_level(resume_text)

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
    
    # -------------------------
    # Smart Detailed Summary
    # -------------------------

    total_job_skills = len(job_skills)
    matched_count = len(matched_skills)
    missing_count = len(missing_skills)

    if match_percent >= 75:
        level = "strong"
    elif match_percent >= 40:
        level = "moderate"
    else:
        level = "low"

    summary = f"""
You are identified as a {profile_level} candidate.

Your resume shows a {level} alignment ({round(match_percent, 2)}%) with the provided job description.

Out of {total_job_skills} important skills detected in the job posting,
you currently match {matched_count} and are missing {missing_count}.

Your strongest aligned skills: {', '.join(matched_skills) if matched_skills else 'None detected'}.

Skills that need improvement: {', '.join(missing_skills) if missing_skills else 'None'}.

To improve your chances, focus on enhancing the missing skills
and aligning your academic or project work more closely with the job requirements.
"""
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
