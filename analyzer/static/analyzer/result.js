document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("analysisResult"));

  if (!data) {
    alert("No analysis data found");
    return;
  }

  // Summary
  document.getElementById("summary-text").textContent = data.summary;
 const matchValue = data.match_percent;
document.getElementById("match-percent").textContent = matchValue + "%";
document.getElementById("progress-fill").style.width = matchValue + "%";


  // Skills
const missing = document.getElementById("missing-skills");
data.missing_skills.forEach(skill => {
  const span = document.createElement("span");
  span.textContent = skill;
  span.className = "skill-tag skill-bad";
  missing.appendChild(span);
});


  data.missing_skills.forEach(skill => {
    const li = document.createElement("li");
    li.textContent = skill;
    missing.appendChild(li);
  });

  // Roadmap
  const roadmap = document.getElementById("roadmap-list");
  data.roadmap.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    roadmap.appendChild(li);
  });

  // Job Matches (simple logic for now)
const jobBox = document.getElementById("job-matches");

const jobRoles = [
  { title: "Backend Developer", keySkills: ["python", "django", "sql"] },
  { title: "Frontend Developer", keySkills: ["html", "css", "javascript"] },
  { title: "Full Stack Intern", keySkills: ["django", "javascript", "sql"] },
  { title: "Data Analyst Intern", keySkills: ["python", "sql"] },
];

jobRoles.forEach(role => {
  let matchedCount = 0;

  role.keySkills.forEach(skill => {
    if (data.matched_skills.includes(skill)) {
      matchedCount++;
    }
  });

  const percent = Math.round(
    (matchedCount / role.keySkills.length) * 100
  );

  const card = document.createElement("div");
  card.className = "job-card";
  card.innerHTML = `
    <h4>${role.title}</h4>
    <p>Match Score: <span>${percent}%</span></p>
  `;

  jobBox.appendChild(card);
});

  // Tabs
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
});
// Strengths
const strengthsList = document.getElementById("strengths-list");
data.strengths.forEach(item => {
  const li = document.createElement("li");
  li.textContent = item;
  strengthsList.appendChild(li);
});

// Improvements
const improvementsList = document.getElementById("improvements-list");
data.improvements.forEach(item => {
  const li = document.createElement("li");
  li.textContent = item;
  improvementsList.appendChild(li);
});
// Job match scores
const jobBox = document.getElementById("job-matches");

const jobRoles = [
  { name: "Frontend Developer", skill: "javascript" },
  { name: "Backend Developer", skill: "django" },
  { name: "SQL Intern", skill: "sql" }
];

jobRoles.forEach(job => {
  const score = data.matched_skills.includes(job.skill) ? 70 : 40;

  const div = document.createElement("div");
  div.innerHTML = `<b>${job.name}</b> — ${score}% match`;
  jobBox.appendChild(div);
});
// =====================
// MATCH PERCENT CHART
// =====================
const matchCtx = document.getElementById("matchChart");

new Chart(matchCtx, {
  type: "doughnut",
  data: {
    labels: ["Matched", "Remaining"],
    datasets: [{
      data: [
        data.match_percent,
        100 - data.match_percent
      ],
      backgroundColor: ["#5b6dfa", "#e0e0e0"],
      borderWidth: 0
    }]
  },
  options: {
    cutout: "70%",
    plugins: {
      legend: { display: false }
    }
  }
});

// =====================
// SKILL COMPARISON BAR
// =====================
const skillCtx = document.getElementById("skillChart");

new Chart(skillCtx, {
  type: "bar",
  data: {
    labels: ["Matched Skills", "Missing Skills"],
    datasets: [{
      label: "Skill Count",
      data: [
        data.matched_skills.length,
        data.missing_skills.length
      ],
      backgroundColor: ["#4caf50", "#f44336"]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  }
});
