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
    const li = document.createElement("li");
    li.textContent = skill;
    matchedList.appendChild(li);
  });

  data.missing_skills.forEach(skill => {
    const li = document.createElement("li");
    li.textContent = skill;
    missingList.appendChild(li);
  });

  // ================= ROADMAP =================
  const roadmap = document.getElementById("roadmap-list");
  data.roadmap.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    roadmap.appendChild(li);
  });

  // ================= STRENGTHS =================
  const strengthsList = document.getElementById("strengths-list");
  data.strengths.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    strengthsList.appendChild(li);
  });

  // ================= IMPROVEMENTS =================
  const improvementsList = document.getElementById("improvements-list");
  data.improvements.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    improvementsList.appendChild(li);
  });

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