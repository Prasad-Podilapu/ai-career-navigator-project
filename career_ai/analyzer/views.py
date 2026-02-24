from sentence_transformers import SentenceTransformer, util
import spacy
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from PyPDF2 import PdfReader
import docx
import re

# -------------------------------
# Load AI models once
# -------------------------------
semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
nlp = spacy.load("en_core_web_sm")

# -------------------------------
# Text Cleaning
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
# Semantic Match
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
    "python", "java", "c", "c++", "c#", "javascript", "typescript",
    "html", "css", "bootstrap", "tailwind",
    "react", "angular", "vue",
    "node", "express",
    "django", "flask", "fastapi",
    "spring", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "sqlite",
    "git", "github", "docker", "kubernetes",
    "aws", "azure", "gcp",
    "linux", "ci/cd", "jenkins",
    "machine learning", "deep learning",
    "data science", "pandas", "numpy",
    "tensorflow", "pytorch",
    "rest api", "api",
    "oop", "data structures",
    "algorithms", "problem solving"
]

# -------------------------------
# Skill Extraction
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
# Page Views
# -------------------------------
def home(request):
    return render(request, "analyzer/index.html")

def upload_page(request):
    return render(request, "analyzer/upload.html")

def result_page(request):
    return render(request, "analyzer/result.html")

# -------------------------------
# Detect Profile Level
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

        else:
            resume_text = resume_file.read().decode(errors="ignore")

    except Exception:
        return JsonResponse(
            {"error": "Could not read resume file"},
            status=400
        )

    # Semantic Match
    match_percent = semantic_match(resume_text, job_desc)
    profile_level = detect_profile_level(resume_text)

    # Skill Matching
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_desc)

    matched_skills = list(set(resume_skills) & set(job_skills))
    missing_skills = list(set(job_skills) - set(resume_skills))

    # -------------------------
# Advanced Resume-Based Summary
# -------------------------

    # Detect experience indicators
    experience_keywords = ["project", "intern", "experience", "developed", "built"]
    has_experience = any(word in resume_text.lower() for word in experience_keywords)

    # Select top skills from resume (not just matched)
    top_resume_skills = ", ".join(resume_skills[:5]) if resume_skills else "various technical skills"

    # Alignment tone
    if match_percent >= 75:
        alignment_text = "strong alignment with the job requirements"
    elif match_percent >= 40:
        alignment_text = "moderate alignment with the job requirements"
    else:
        alignment_text = "limited alignment with the job requirements"

    # Experience sentence
    if has_experience:
        experience_line = "The resume reflects practical exposure through projects or hands-on development experience."
    else:
        experience_line = "The profile appears academically focused with foundational technical exposure."

    summary = (
        f"{profile_level} candidate with technical expertise in {top_resume_skills}. "
        f"The resume demonstrates {alignment_text} ({round(match_percent,2)}%). "
        f"{experience_line} "
        f"The candidate is suitable for entry-level or growth-oriented technical roles, "
        f"with opportunities to further strengthen advanced problem-solving and system-level skills."
    )

    # Roadmap
    # -------------------------
# SMART PROFESSIONAL ROADMAP
# ------------------------

    roadmap = []

    for skill in missing_skills:

        if skill in ["data structures", "algorithms"]:
            roadmap.append({
                "skill": skill,
                "priority": "High",
                "difficulty": "Advanced",
                "time": "4 Weeks",
                "impact_score": 95,
                "impact": "Critical for technical interviews and backend engineering roles.",
                "weekly_plan": [
                    "Master core concepts & complexity analysis",
                    "Solve 50+ structured coding problems",
                    "Implement custom data structures",
                    "Mock interview preparation"
                ]
            })

        elif skill in ["sql"]:
            roadmap.append({
                "skill": skill,
                "priority": "High",
                "difficulty": "Intermediate",
                "time": "3 Weeks",
                "impact_score": 85,
                "impact": "Essential for backend systems and data-driven applications.",
                "weekly_plan": [
                    "Database fundamentals & normalization",
                    "Advanced queries & joins",
                    "Indexing & performance tuning",
                    "Build data-driven mini project"
                ]
            })

        elif skill in ["react", "flask", "django"]:
            roadmap.append({
                "skill": skill,
                "priority": "Medium",
                "difficulty": "Intermediate",
                "time": "3 Weeks",
                "impact_score": 75,
                "impact": "Improves employability for full-stack roles.",
                "weekly_plan": [
                    "Core framework fundamentals",
                    "State management / APIs",
                    "Build complete project",
                    "Deploy & optimize"
                ]
            })

        else:
            roadmap.append({
                "skill": skill,
                "priority": "Medium",
                "difficulty": "Beginner",
                "time": "2 Weeks",
                "impact_score": 60,
                "impact": "Strengthens overall technical foundation.",
                "weekly_plan": [
                    "Understand basics",
                    "Hands-on practice",
                    "Small implementation project",
                    "Add to resume"
                ]
            })

    # Sort by impact score
    roadmap = sorted(roadmap, key=lambda x: x["impact_score"], reverse=True)

    # Strengths & Improvements
    strengths = [f"Strong knowledge of {skill}" for skill in matched_skills]
    improvements = [
        f"Improve your {skill} skills to match job requirements"
        for skill in missing_skills
    ]

# Job Role Suggestions
# -------------------------

    JOB_ROLES = {
        "Backend Developer": ["python", "django", "flask", "sql", "api"],
        "Frontend Developer": ["javascript", "react", "html", "css"],
        "Full Stack Developer": ["python", "django", "javascript", "react", "sql"],
        "Data Analyst": ["python", "pandas", "numpy", "sql"],
        "DevOps Engineer": ["docker", "kubernetes", "aws", "linux", "ci/cd"]
    }

    job_matches = []

    for role, skills_required in JOB_ROLES.items():
        matched = list(set(skills_required) & set(resume_skills))
        missing = list(set(skills_required) - set(resume_skills))

        fit_percent = int((len(matched) / len(skills_required)) * 100)

        if fit_percent >= 40:
            job_matches.append({
                "role": role,
                "fit": fit_percent,
                "matched": matched,
                "missing": missing
            })

    # 🔥 SORT AFTER APPENDING
    job_matches = sorted(job_matches, key=lambda x: x["fit"], reverse=True)
            
    return JsonResponse({
    "summary": summary,
    "match_percent": round(match_percent, 2),
    "matched_skills": matched_skills,
    "missing_skills": missing_skills,
    "roadmap": roadmap,
    "strengths": strengths,
    "improvements": improvements,
    "job_matches": job_matches
})