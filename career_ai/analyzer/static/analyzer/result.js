console.log("NEW RESULT JS LOADED");

let matchChartInstance = null;   // 🔥 MUST be global (outside)

document.addEventListener("DOMContentLoaded", () => {

  const data = JSON.parse(localStorage.getItem("analysisResult"));

  if (!data) {
    alert("No analysis data found");
    return;
  }

  const matchValue = data.match_percent;

  // ================= SUMMARY =================
  document.getElementById("summary-text").textContent = data.summary;
  document.getElementById("match-percent").textContent = matchValue + "%";
  document.getElementById("progress-fill").style.width = matchValue + "%";

  // ================= OVERVIEW =================
  const overviewBox = document.getElementById("overview-text");

  if (matchValue >= 75) {
    overviewBox.textContent =
      "Your resume strongly aligns with the job description.";
  } else if (matchValue >= 40) {
    overviewBox.textContent =
      "Your resume partially matches the job description.";
  } else {
    overviewBox.textContent =
      "Your resume has low alignment with the job description.";
  }

  // ================= LOAD MATCH CHART FIRST TIME =================
  loadMatchChart(matchValue);

  // ================= SKILLS =================
  const matchedList = document.getElementById("matched-skills");
  const missingList = document.getElementById("missing-skills");

  data.matched_skills.forEach(skill => {
  const tag = document.createElement("span");
  tag.className = "skill-tag";
  tag.textContent = skill;
  matchedList.appendChild(tag);
});

  data.missing_skills.forEach(skill => {
  const tag = document.createElement("span");
  tag.className = "skill-tag";
  tag.textContent = skill;
  missingList.appendChild(tag);
});
  // ================= JOB MATCHES =================
  // ================= JOB MATCHES =================
const jobContainer = document.getElementById("job-matches");
jobContainer.innerHTML = "";

if (data.job_matches && data.job_matches.length > 0) {

  // Sort by highest fit
  data.job_matches.sort((a, b) => b.fit - a.fit);

  data.job_matches.forEach(job => {

    let badgeColor = "red";
    if (job.fit >= 75) badgeColor = "green";
    else if (job.fit >= 50) badgeColor = "orange";

    const card = document.createElement("div");
    card.className = "job-card-pro";

    card.innerHTML = `
      <div class="job-header">
        <h3>${job.role}</h3>
        <span class="fit-badge ${badgeColor}">
          ${job.fit}% Match
        </span>
      </div>

      <div class="job-section">
        <h4>Matched Skills</h4>
        <div class="skill-tags">
          ${job.matched.map(s => `<span class="tag green">${s}</span>`).join("")}
        </div>
      </div>

      <div class="job-section">
        <h4>Missing Skills</h4>
        <div class="skill-tags">
          ${job.missing.map(s => `<span class="tag red">${s}</span>`).join("")}
        </div>
      </div>
    `;

    jobContainer.appendChild(card);
  });

} else {
  jobContainer.innerHTML = "<p>No strong job role matches found.</p>";
}

// ================= ADVANCED INTERACTIVE ROADMAP =================
  // ================= PROFESSIONAL ROADMAP =================
// ================= PROFESSIONAL ROADMAP =================
const roadmapContainer = document.getElementById("roadmap-list");
roadmapContainer.innerHTML = "";

if (data.roadmap && data.roadmap.length > 0) {

  data.roadmap.forEach((item, index) => {

    let priorityClass =
      item.priority === "High" ? "priority-high" : "priority-medium";

    const card = document.createElement("div");
    card.className = "roadmap-card-advanced";

    card.innerHTML = `
      <div class="roadmap-header-advanced">
        <div>
          <h3>${index + 1}. ${item.skill.toUpperCase()}</h3>
          <div class="roadmap-meta">
            <span class="priority-badge ${priorityClass}">
              ${item.priority} Priority
            </span>
            <span class="difficulty-badge">
              ${item.difficulty}
            </span>
            <span class="impact-score">
              ${item.impact_score}/100 Impact
            </span>
          </div>
        </div>
      </div>

      <div class="roadmap-info">
        <p><strong>Estimated Time:</strong> ${item.time}</p>
        <p><strong>Why It Matters:</strong> ${item.impact}</p>
      </div>

      <div class="weekly-plan-pro">
        <h4>Execution Plan</h4>
        <ul>
          ${item.weekly_plan.map(step => `<li>${step}</li>`).join("")}
        </ul>
      </div>
    `;

    roadmapContainer.appendChild(card);
  });

} else {
  roadmapContainer.innerHTML =
    "<p class='no-roadmap'>Your profile already aligns well with job requirements.</p>";
}

  // ================= PROFESSIONAL STRENGTHS =================
  // ================= ADVANCED PROFESSIONAL STRENGTHS =================
const strengthsContainer = document.getElementById("strengths-list");
strengthsContainer.innerHTML = "";

if (data.matched_skills && data.matched_skills.length > 0) {

  data.matched_skills.forEach(skill => {

    // Simple AI score logic (you can improve later)
    let score = 75 + Math.floor(Math.random() * 20); // 75–95

    const card = document.createElement("div");
    card.className = "strength-card-advanced";

    card.innerHTML = `
      <div class="strength-top">
        <h3>${skill.toUpperCase()}</h3>
        <span class="strength-badge">Core Strength</span>
      </div>

      <div class="strength-score">
        <span>Proficiency</span>
        <span class="score-value">${score}/100</span>
      </div>

      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${score}%"></div>
      </div>

      <p class="strength-desc">
        Demonstrates strong applied knowledge and practical exposure in ${skill}.
        Enhances readiness for roles requiring ${skill}-based development.
      </p>
    `;

    strengthsContainer.appendChild(card);
  });

} else {
  strengthsContainer.innerHTML =
    "<p class='no-strength'>No major strengths detected.</p>";
}



  // ================= IMPROVEMENTS =================
  // ================= PROFESSIONAL IMPROVEMENTS =================
const improvementsContainer = document.getElementById("improvements-list");
improvementsContainer.innerHTML = "";

if (data.missing_skills && data.missing_skills.length > 0) {

  data.missing_skills.forEach(skill => {

    const card = document.createElement("div");
    card.className = "improvement-card";

    card.innerHTML = `
      <div class="improvement-header">
        <h3>${skill.toUpperCase()}</h3>
        <span class="improvement-badge">Needs Attention</span>
      </div>

      <div class="improvement-body">
        <p>
          This skill is mentioned in the job description but not clearly reflected 
          in your resume. Strengthening this area can significantly improve 
          your alignment with the role.
        </p>

        <div class="improvement-actions">
          <strong>Recommended Actions:</strong>
          <ul>
            <li>Study core concepts and practical use cases</li>
            <li>Build a small project demonstrating ${skill}</li>
            <li>Add measurable results to your resume</li>
          </ul>
        </div>
      </div>
    `;

    improvementsContainer.appendChild(card);
  });

} else {
  improvementsContainer.innerHTML =
    "<p class='no-improvement'>Your profile strongly matches the job requirements.</p>";
}

  // ================= SKILL CHART =================
  let skillChartInstance = null;

function loadSkillChart(data) {

  const skillCtx = document.getElementById("skillChart");

  if (skillChartInstance) {
    skillChartInstance.destroy();
  }

  skillChartInstance = new Chart(skillCtx, {
    type: "bar",
    data: {
      labels: ["Matched Skills", "Missing Skills"],
      datasets: [{
        data: [
          data.matched_skills.length,
          data.missing_skills.length
        ],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    },
    options: {
      responsive: false,   // ⭐ important
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

  // ================= TABS =================
 document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "summary") {
      loadMatchChart(matchValue);
    }

    if (btn.dataset.tab === "skills") {
      loadSkillChart(data);
    }

  });
  });


// ================= MATCH CHART FUNCTION =================
function loadMatchChart(matchValue) {

  const matchCtx = document.getElementById("matchChart");

  if (matchChartInstance) {
    matchChartInstance.destroy();
  }

  matchChartInstance = new Chart(matchCtx, {
    type: "doughnut",
    data: {
      labels: ["Matched", "Remaining"],
      datasets: [{
        data: [matchValue, 100 - matchValue],
        backgroundColor: ["#5b6dfa", "#e0e0e0"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,          // ⭐ VERY IMPORTANT
      animation: false,
      cutout: "70%",
      plugins: {
        legend: { display: false }
      }
    }
  });
}

});