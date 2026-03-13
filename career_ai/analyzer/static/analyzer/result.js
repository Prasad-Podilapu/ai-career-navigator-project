let matchChartInstance = null;
let skillChartInstance = null;

function clampPercent(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function createTag(text, className) {
  const tag = document.createElement("span");
  tag.className = className;
  tag.textContent = text;
  return tag;
}

function createEmptyState(message) {
  const emptyState = document.createElement("p");
  emptyState.className = "empty-state";
  emptyState.textContent = message;
  return emptyState;
}

function renderSummaryHero(summary, summarySections) {
  const container = document.getElementById("summary-text");
  if (!container) {
    return;
  }

  const hasStructuredSummary =
    summarySections.candidate_profile ||
    summarySections.job_match_insight ||
    summarySections.skill_gaps;

  if (!hasStructuredSummary) {
    container.textContent = summary;
    return;
  }

  const leadLine = summarySections.candidate_profile || summary;
  const supportLine = summarySections.job_match_insight || "";
  const gapLine = summarySections.skill_gaps ? `Skill gaps: ${summarySections.skill_gaps}` : "";

  container.innerHTML = `
    <span class="summary-box-kicker">Evidence-Based Summary</span>
    <p class="summary-box-lead">${leadLine}</p>
    ${supportLine ? `<p class="summary-box-detail">${supportLine}</p>` : ""}
    ${gapLine ? `<p class="summary-box-detail summary-box-gap">${gapLine}</p>` : ""}
  `;
}

function renderSummarySections(summarySections) {
  const fields = {
    candidate_profile: document.getElementById("summary-candidate-profile"),
    relevant_skills: document.getElementById("summary-relevant-skills"),
    job_match_insight: document.getElementById("summary-job-match-insight"),
    skill_gaps: document.getElementById("summary-skill-gaps")
  };

  Object.entries(fields).forEach(([key, element]) => {
    if (element) {
      element.textContent = summarySections[key] || "No details available.";
    }
  });
}

function renderSummaryEvidenceStrip(skillDashboard, atsAnalysis) {
  const matched = document.getElementById("summary-matched-count");
  const missing = document.getElementById("summary-missing-count");
  const required = document.getElementById("summary-required-count");
  const sections = document.getElementById("summary-ats-sections");

  if (matched) {
    matched.textContent = `${skillDashboard.matched_skill_count}`;
  }
  if (missing) {
    missing.textContent = `${skillDashboard.missing_skill_count}`;
  }
  if (required) {
    required.textContent = `${skillDashboard.required_skill_count}`;
  }
  if (sections) {
    sections.textContent = `${atsAnalysis.sections_found}`;
  }
}

function renderSidebarStats(matchPercent, skillDashboard, atsAnalysis) {
  const matchElement = document.getElementById("sidebar-match-percent");
  const atsElement = document.getElementById("sidebar-ats-score");
  const skillElement = document.getElementById("sidebar-skill-score");

  if (matchElement) {
    matchElement.textContent = `${clampPercent(matchPercent)}%`;
  }
  if (atsElement) {
    atsElement.textContent = `${clampPercent(atsAnalysis.score)}%`;
  }
  if (skillElement) {
    skillElement.textContent = `${clampPercent(skillDashboard.skill_match_score)}%`;
  }
}

function setOverviewText(matchValue) {
  const overviewBox = document.getElementById("overview-text");
  if (!overviewBox) {
    return;
  }

  if (matchValue >= 75) {
    overviewBox.textContent =
      "Your resume strongly aligns with the job description and already reflects many of the expected skills.";
    return;
  }

  if (matchValue >= 40) {
    overviewBox.textContent =
      "Your resume shows partial alignment with the role. A few targeted improvements could noticeably increase your fit.";
    return;
  }

  overviewBox.textContent =
    "Your resume has low alignment with this role right now. Focus on the missing skills and roadmap sections to improve your positioning.";
}

function normalizeSkillDashboard(rawDashboard, matchedSkills, missingSkills) {
  const fallbackRequiredCount = matchedSkills.length + missingSkills.length;
  const fallbackScore = fallbackRequiredCount
    ? Math.round((matchedSkills.length / fallbackRequiredCount) * 100)
    : 0;

  return {
    skill_match_score: rawDashboard?.skill_match_score ?? fallbackScore,
    required_skill_count: rawDashboard?.required_skill_count ?? fallbackRequiredCount,
    matched_skill_count: rawDashboard?.matched_skill_count ?? matchedSkills.length,
    missing_skill_count: rawDashboard?.missing_skill_count ?? missingSkills.length,
    critical_skills: Array.isArray(rawDashboard?.critical_skills) ? rawDashboard.critical_skills : [],
    category_progress: Array.isArray(rawDashboard?.category_progress) ? rawDashboard.category_progress : [],
    recommended_skills: Array.isArray(rawDashboard?.recommended_skills) ? rawDashboard.recommended_skills : missingSkills,
    ai_skill_insight: rawDashboard?.ai_skill_insight || ""
  };
}

function normalizeAtsAnalysis(rawAtsAnalysis, matchedSkills, missingSkills) {
  const fallbackRequiredCount = matchedSkills.length + missingSkills.length;
  const fallbackKeywordCoverage = fallbackRequiredCount
    ? Math.round((matchedSkills.length / fallbackRequiredCount) * 100)
    : 0;

  return {
    score: clampPercent(rawAtsAnalysis?.score),
    score_label: rawAtsAnalysis?.score_label || "ATS analysis will appear after processing the resume.",
    keyword_coverage: rawAtsAnalysis?.keyword_coverage ?? fallbackKeywordCoverage,
    sections_found: rawAtsAnalysis?.sections_found ?? 0,
    checks: Array.isArray(rawAtsAnalysis?.checks) ? rawAtsAnalysis.checks : [],
    improvements: Array.isArray(rawAtsAnalysis?.improvements) ? rawAtsAnalysis.improvements : [],
    resume_sections: rawAtsAnalysis?.resume_sections || null,
    ats_resume_text: rawAtsAnalysis?.ats_resume_text || "",
    download_file_name: rawAtsAnalysis?.download_file_name || "ats_resume.docx"
  };
}

function extractFilenameFromDisposition(headerValue, fallbackName) {
  if (!headerValue) {
    return fallbackName;
  }

  const match = headerValue.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallbackName;
}

function normalizeJobMatches(rawJobMatches) {
  if (!Array.isArray(rawJobMatches)) {
    return [];
  }

  return rawJobMatches.map((job) => ({
    role: job.role || job.title || "Suggested Role",
    fit: typeof job.fit === "number" ? job.fit : (typeof job.score === "number" ? job.score : 0),
    matched: Array.isArray(job.matched)
      ? job.matched
      : (typeof job.matched === "number" && Array.isArray(job.keySkills)
        ? job.keySkills.slice(0, job.matched)
        : []),
    missing: Array.isArray(job.missing) ? job.missing : []
  }));
}

function normalizeRoadmap(rawRoadmap) {
  if (Array.isArray(rawRoadmap)) {
    return rawRoadmap;
  }

  if (rawRoadmap && typeof rawRoadmap === "object") {
    const roadmapItems = [];
    ["6_months", "12_months"].forEach((bucket) => {
      const items = rawRoadmap[bucket];
      if (Array.isArray(items)) {
        items.forEach((item) => {
          roadmapItems.push({
            skill: item.skill,
            phase: bucket === "6_months" ? "Near-Term Focus" : "Longer-Term Focus",
            weekly_plan: Array.isArray(item.steps) ? item.steps : []
          });
        });
      }
    });
    return roadmapItems;
  }

  return [];
}

function normalizeStrengths(rawStrengths, matchedSkills) {
  if (Array.isArray(rawStrengths) && rawStrengths.length) {
    return rawStrengths.map((item) => (
      typeof item === "string"
        ? {
            skill: item,
            category: "Matched Skill",
            evidence_sections: [],
            summary: item,
            evidence_note: ""
          }
        : {
            skill: item.skill || "Matched Skill",
            category: item.category || "Matched Skill",
            evidence_sections: Array.isArray(item.evidence_sections) ? item.evidence_sections : [],
            summary: item.summary || "",
            evidence_note: item.evidence_note || ""
          }
    ));
  }

  return matchedSkills.map((skill) => ({
    skill,
    category: "Matched Skill",
    evidence_sections: [],
    summary: `${skill} appears in both the resume and the job description.`,
    evidence_note: "Matched directly from the uploaded documents."
  }));
}

function normalizeImprovements(rawImprovements, missingSkills) {
  if (Array.isArray(rawImprovements) && rawImprovements.length) {
    return rawImprovements.map((item) => (
      typeof item === "string"
        ? {
            skill: item,
            category: "Missing Skill",
            reason: item,
            job_signal: "",
            resume_action: "",
            upskill_action: "",
            suggested_section: "Skills"
          }
        : {
            skill: item.skill || "Missing Skill",
            category: item.category || "Missing Skill",
            reason: item.reason || "",
            job_signal: item.job_signal || "",
            resume_action: item.resume_action || "",
            upskill_action: item.upskill_action || "",
            suggested_section: item.suggested_section || "Skills"
          }
    ));
  }

  return missingSkills.map((skill) => ({
    skill,
    category: "Missing Skill",
    reason: `${skill} was found in the job description but not in the resume text.`,
    job_signal: "",
    resume_action: "Add it only if real evidence exists.",
    upskill_action: "Otherwise, treat it as a learning target.",
    suggested_section: "Skills"
  }));
}

function loadMatchChart(matchValue) {
  if (typeof Chart === "undefined") {
    return;
  }

  const chartCanvas = document.getElementById("matchChart");
  if (!chartCanvas) {
    return;
  }

  if (matchChartInstance) {
    matchChartInstance.destroy();
  }

  matchChartInstance = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: ["Matched", "Remaining"],
      datasets: [{
        data: [matchValue, 100 - matchValue],
        backgroundColor: ["#5b6dfa", "#e5e7eb"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function loadSkillChart(data) {
  if (typeof Chart === "undefined") {
    return;
  }

  const chartCanvas = document.getElementById("skillChart");
  if (!chartCanvas) {
    return;
  }

  if (skillChartInstance) {
    skillChartInstance.destroy();
  }

  skillChartInstance = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: ["Matched Skills", "Missing Skills"],
      datasets: [{
        data: [
          data.skill_dashboard.matched_skill_count,
          data.skill_dashboard.missing_skill_count
        ],
        backgroundColor: ["#34c759", "#f44336"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function renderSkillScore(skillDashboard) {
  const score = clampPercent(skillDashboard.skill_match_score);
  document.getElementById("skill-match-score").textContent = `${score}%`;
  document.getElementById("skill-score-ring-value").textContent = `${score}%`;
  document.getElementById("required-skill-count").textContent = `${skillDashboard.required_skill_count}`;
  document.getElementById("matched-skill-count").textContent = `${skillDashboard.matched_skill_count}`;
  document.getElementById("missing-skill-count").textContent = `${skillDashboard.missing_skill_count}`;
  document.getElementById("skills-score-note").textContent =
    `${skillDashboard.matched_skill_count} of ${skillDashboard.required_skill_count} required skills were found in the resume.`;

  const ring = document.getElementById("skill-score-ring");
  if (ring) {
    ring.style.background = `conic-gradient(#34c759 ${score * 3.6}deg, #e5e7eb 0deg)`;
  }
}

function renderCriticalSkills(skillDashboard) {
  const container = document.getElementById("critical-skills-list");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!skillDashboard.critical_skills.length) {
    container.appendChild(createEmptyState("No critical job-description skills were extracted."));
    return;
  }

  skillDashboard.critical_skills.forEach((item) => {
    const row = document.createElement("div");
    row.className = "critical-skill-item";

    const meta = document.createElement("div");
    meta.className = "critical-skill-meta";

    const name = document.createElement("span");
    name.className = "critical-skill-name";
    name.textContent = item.skill;

    const weight = document.createElement("span");
    weight.className = "critical-skill-weight";
    weight.textContent = `Importance score: ${item.importance_score}`;

    const status = document.createElement("span");
    status.className = `critical-skill-status ${item.matched ? "matched" : "missing"}`;
    status.textContent = item.matched ? "Matched" : "Missing";

    meta.appendChild(name);
    meta.appendChild(weight);
    row.appendChild(meta);
    row.appendChild(status);
    container.appendChild(row);
  });
}

function renderSkills(containerId, skills, isMissing) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!skills.length) {
    container.appendChild(createEmptyState(
      isMissing ? "No missing skills were detected for this role." : "No matched skills were detected."
    ));
    return;
  }

  skills.forEach((skill) => {
    container.appendChild(createTag(skill, "skill-tag"));
  });
}

function renderRecommendedSkills(skillDashboard) {
  const container = document.getElementById("recommended-skills");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!skillDashboard.recommended_skills.length) {
    container.appendChild(createEmptyState("No recommended skills to learn. Required job skills already appear in the resume."));
    return;
  }

  skillDashboard.recommended_skills.forEach((skill) => {
    container.appendChild(createTag(skill, "skill-tag"));
  });
}

function renderCategoryProgress(skillDashboard) {
  const container = document.getElementById("category-progress-list");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!skillDashboard.category_progress.length) {
    container.appendChild(createEmptyState("No categorized job-description skills were available for comparison."));
    return;
  }

  skillDashboard.category_progress.forEach((item) => {
    const card = document.createElement("div");
    card.className = "category-progress-item";

    const head = document.createElement("div");
    head.className = "category-progress-head";
    head.innerHTML = `<strong>${item.category}</strong><span>${item.matched_count}/${item.required_count} matched</span>`;

    const bar = document.createElement("div");
    bar.className = "category-progress-bar";

    const fill = document.createElement("div");
    fill.className = "category-progress-fill";
    fill.style.width = `${item.percent}%`;
    bar.appendChild(fill);

    const foot = document.createElement("div");
    foot.className = "category-progress-foot";
    foot.textContent = item.missing_skills.length
      ? `Missing in this category: ${item.missing_skills.join(", ")}`
      : "All extracted required skills in this category are covered.";

    card.appendChild(head);
    card.appendChild(bar);
    card.appendChild(foot);
    container.appendChild(card);
  });
}

function renderSkillInsight(skillDashboard) {
  const container = document.getElementById("skill-insight-text");
  if (container) {
    container.textContent = skillDashboard.ai_skill_insight || "No skill insight available.";
  }
}

function renderAtsAnalysis(atsAnalysis) {
  const scoreElement = document.getElementById("ats-score-value");
  const labelElement = document.getElementById("ats-score-label");
  const keywordCoverageElement = document.getElementById("ats-keyword-coverage");
  const sectionsFoundElement = document.getElementById("ats-sections-found");
  const checksContainer = document.getElementById("ats-checks-list");
  const improvementsContainer = document.getElementById("ats-improvements-list");
  const previewElement = document.getElementById("ats-resume-preview");
  const downloadButton = document.getElementById("download-ats-resume");

  if (scoreElement) {
    scoreElement.textContent = `${clampPercent(atsAnalysis.score)}%`;
  }
  if (labelElement) {
    labelElement.textContent = atsAnalysis.score_label;
  }
  if (keywordCoverageElement) {
    keywordCoverageElement.textContent = `${clampPercent(atsAnalysis.keyword_coverage)}%`;
  }
  if (sectionsFoundElement) {
    sectionsFoundElement.textContent = `${atsAnalysis.sections_found}/4`;
  }

  if (checksContainer) {
    checksContainer.innerHTML = "";
    if (!atsAnalysis.checks.length) {
      checksContainer.appendChild(createEmptyState("No ATS checks are available for this analysis."));
    } else {
      atsAnalysis.checks.forEach((item) => {
        const row = document.createElement("div");
        row.className = "ats-check-item";

        const meta = document.createElement("div");
        meta.className = "ats-check-meta";

        const label = document.createElement("strong");
        label.className = "ats-check-label";
        label.textContent = item.label;

        const detail = document.createElement("p");
        detail.className = "ats-check-detail";
        detail.textContent = item.detail;

        meta.appendChild(label);
        meta.appendChild(detail);

        const score = document.createElement("div");
        score.className = "ats-check-score";
        score.textContent = `${item.points_awarded}/${item.points_possible}`;

        const status = document.createElement("span");
        status.className = `ats-check-status ${item.status || "missing"}`;
        status.textContent = item.status === "passed" ? "Passed" : item.status === "partial" ? "Partial" : "Missing";

        const side = document.createElement("div");
        side.className = "ats-check-side";
        side.appendChild(score);
        side.appendChild(status);

        row.appendChild(meta);
        row.appendChild(side);
        checksContainer.appendChild(row);
      });
    }
  }

  if (improvementsContainer) {
    improvementsContainer.innerHTML = "";
    if (!atsAnalysis.improvements.length) {
      improvementsContainer.appendChild(createEmptyState("No ATS improvements were suggested from the current resume content."));
    } else {
      atsAnalysis.improvements.forEach((item) => {
        improvementsContainer.appendChild(createTag(item, "ats-improvement-tag"));
      });
    }
  }

  if (previewElement) {
    previewElement.textContent = atsAnalysis.ats_resume_text || "No ATS resume preview is available.";
  }

  if (downloadButton) {
    downloadButton.disabled = !atsAnalysis.resume_sections;
    downloadButton.onclick = async () => {
      if (!atsAnalysis.resume_sections) {
        return;
      }

      const defaultLabel = "Download ATS Resume (.docx)";
      downloadButton.disabled = true;
      downloadButton.textContent = "Preparing DOCX...";

      try {
        const response = await fetch("/download-ats-resume/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ats_analysis: atsAnalysis
          })
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.error || "ATS resume download failed.");
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = extractFilenameFromDisposition(
          response.headers.get("content-disposition"),
          atsAnalysis.download_file_name
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("ATS resume download error:", error);
        window.alert(error.message || "Unable to download the ATS resume right now.");
      } finally {
        downloadButton.disabled = !atsAnalysis.resume_sections;
        downloadButton.textContent = defaultLabel;
      }
    };
  }
}

function renderJobMatches(jobMatches) {
  const container = document.getElementById("job-matches");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!jobMatches.length) {
    container.appendChild(createEmptyState("No strong job role matches were found."));
    return;
  }

  [...jobMatches]
    .sort((first, second) => second.fit - first.fit)
    .forEach((job) => {
      const badgeColor = job.fit >= 75 ? "green" : job.fit >= 50 ? "orange" : "red";
      const card = document.createElement("article");
      card.className = "job-card-pro";

      const header = document.createElement("div");
      header.className = "job-header";

      const title = document.createElement("h3");
      title.textContent = job.role;

      const badge = document.createElement("span");
      badge.className = `fit-badge ${badgeColor}`;
      badge.textContent = `${job.fit}% Match`;

      header.appendChild(title);
      header.appendChild(badge);
      card.appendChild(header);

      [
        { label: "Matched Skills", values: job.matched || [], tagClass: "tag green" },
        { label: "Missing Skills", values: job.missing || [], tagClass: "tag red" }
      ].forEach((section) => {
        const block = document.createElement("div");
        block.className = "job-section";

        const heading = document.createElement("h4");
        heading.textContent = section.label;

        const tags = document.createElement("div");
        tags.className = "skill-tags";

        if (section.values.length) {
          section.values.forEach((value) => {
            tags.appendChild(createTag(value, section.tagClass));
          });
        } else {
          tags.appendChild(createEmptyState(`No ${section.label.toLowerCase()} listed.`));
        }

        block.appendChild(heading);
        block.appendChild(tags);
        card.appendChild(block);
      });

      container.appendChild(card);
    });
}

function renderRoadmap(roadmap) {
  const container = document.getElementById("roadmap-list");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!roadmap.length) {
    container.appendChild(createEmptyState("The resume already covers the extracted job-description skills well enough that no extra roadmap items were generated."));
    return;
  }

  roadmap.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "roadmap-card-advanced";

    const header = document.createElement("div");
    header.className = "roadmap-header-row";

    const titleWrap = document.createElement("div");
    titleWrap.className = "roadmap-title-wrap";

    const title = document.createElement("h3");
    title.textContent = `${index + 1}. ${String(item.skill || "Skill").toUpperCase()}`;

    const badgeRow = document.createElement("div");
    badgeRow.className = "roadmap-badge-row";
    badgeRow.appendChild(createTag(item.category || "Gap", "roadmap-pill"));
    if (item.suggested_section) {
      badgeRow.appendChild(createTag(`Update ${item.suggested_section}`, "roadmap-pill muted"));
    }

    titleWrap.appendChild(title);
    titleWrap.appendChild(badgeRow);
    header.appendChild(titleWrap);

    const info = document.createElement("div");
    info.className = "roadmap-info";

    const focus = document.createElement("p");
    focus.textContent = `Focus Area: ${item.phase || "Suggested development based on job-description skills that were not found in the resume."}`;
    info.appendChild(focus);

    if (item.gap_reason) {
      const reason = document.createElement("p");
      reason.className = "roadmap-note";
      reason.textContent = item.gap_reason;
      info.appendChild(reason);
    }

    if (item.job_signal) {
      const signal = document.createElement("div");
      signal.className = "roadmap-signal";
      signal.textContent = `Job signal: ${item.job_signal}`;
      info.appendChild(signal);
    }

    const weeklyPlan = document.createElement("div");
    weeklyPlan.className = "weekly-plan-pro";

    const weeklyPlanHeading = document.createElement("h4");
    weeklyPlanHeading.textContent = "Evidence-Based Next Steps";

    const list = document.createElement("ul");
    (item.weekly_plan || []).forEach((step) => {
      const listItem = document.createElement("li");
      listItem.textContent = step;
      list.appendChild(listItem);
    });

    weeklyPlan.appendChild(weeklyPlanHeading);
    weeklyPlan.appendChild(list);
    card.appendChild(header);
    card.appendChild(info);
    card.appendChild(weeklyPlan);
    container.appendChild(card);
  });
}

function renderStrengths(strengths) {
  const container = document.getElementById("strengths-list");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!strengths.length) {
    container.appendChild(createEmptyState("No direct resume-to-job strengths were verified."));
    return;
  }

  strengths.forEach((item) => {
    const card = document.createElement("article");
    card.className = "strength-card-advanced";

    const top = document.createElement("div");
    top.className = "strength-top";
    top.appendChild(Object.assign(document.createElement("h3"), { textContent: String(item.skill || "Skill").toUpperCase() }));
    top.appendChild(createTag("Verified Match", "strength-badge"));

    const metaRow = document.createElement("div");
    metaRow.className = "strength-meta-row";
    metaRow.appendChild(createTag(item.category || "Matched Skill", "strength-chip"));
    if (item.evidence_sections?.length) {
      metaRow.appendChild(createTag(item.evidence_sections.join(" • "), "strength-chip muted"));
    }

    const description = document.createElement("p");
    description.className = "strength-desc";
    description.textContent = item.summary || "Matched evidence was found in both uploaded documents.";

    const note = document.createElement("p");
    note.className = "strength-note";
    note.textContent = item.evidence_note || "";

    card.appendChild(top);
    card.appendChild(metaRow);
    card.appendChild(description);
    if (item.evidence_note) {
      card.appendChild(note);
    }
    container.appendChild(card);
  });
}

function renderImprovements(improvements) {
  const container = document.getElementById("improvements-list");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  if (!improvements.length) {
    container.appendChild(createEmptyState("No missing job-description skills were detected from the current resume text."));
    return;
  }

  improvements.forEach((item) => {
    const card = document.createElement("article");
    card.className = "improvement-card";

    const header = document.createElement("div");
    header.className = "improvement-header";
    header.appendChild(Object.assign(document.createElement("h3"), { textContent: String(item.skill || "Skill").toUpperCase() }));
    header.appendChild(createTag("Missing From Resume", "improvement-badge"));

    const body = document.createElement("div");
    body.className = "improvement-body";

    const paragraph = document.createElement("p");
    paragraph.textContent = item.reason || "This requirement appears in the job description but was not detected in the resume.";

    const meta = document.createElement("div");
    meta.className = "improvement-meta";
    meta.appendChild(createTag(item.category || "Missing Skill", "improvement-chip"));
    if (item.suggested_section) {
      meta.appendChild(createTag(`Best section: ${item.suggested_section}`, "improvement-chip muted"));
    }

    const actions = document.createElement("div");
    actions.className = "improvement-actions";

    const actionsTitle = document.createElement("strong");
    actionsTitle.textContent = "Recommended Resume Action:";

    if (item.job_signal) {
      const signal = document.createElement("p");
      signal.className = "improvement-signal";
      signal.textContent = `Job signal: ${item.job_signal}`;
      body.appendChild(signal);
    }

    const actionList = document.createElement("ul");
    [
      item.resume_action || "Add it only if verified evidence exists.",
      item.upskill_action || "Otherwise, treat it as a learning target."
    ].forEach((action) => {
      const listItem = document.createElement("li");
      listItem.textContent = action;
      actionList.appendChild(listItem);
    });

    actions.appendChild(actionsTitle);
    actions.appendChild(actionList);
    body.appendChild(paragraph);
    body.appendChild(meta);
    body.appendChild(actions);
    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const storedData = localStorage.getItem("analysisResult");
  if (!storedData) {
    alert("No analysis data found. Please analyze a resume first.");
    window.location.href = "/upload/";
    return;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(storedData);
  } catch (error) {
    alert("Stored analysis data is invalid. Please run the analysis again.");
    localStorage.removeItem("analysisResult");
    window.location.href = "/upload/";
    return;
  }

  const matchedSkills = Array.isArray(parsedData.matched_skills) ? parsedData.matched_skills : [];
  const missingSkills = Array.isArray(parsedData.missing_skills) ? parsedData.missing_skills : [];

  const data = {
    summary: parsedData.summary || "No summary available.",
    summary_sections: {
      candidate_profile: parsedData.summary_sections?.candidate_profile || "",
      relevant_skills: parsedData.summary_sections?.relevant_skills || "",
      job_match_insight: parsedData.summary_sections?.job_match_insight || "",
      skill_gaps: parsedData.summary_sections?.skill_gaps || "",
      analysis_evidence: parsedData.summary_sections?.analysis_evidence || ""
    },
    match_percent: clampPercent(parsedData.match_percent),
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    roadmap: normalizeRoadmap(parsedData.roadmap),
    job_matches: normalizeJobMatches(parsedData.job_matches),
    skill_dashboard: normalizeSkillDashboard(parsedData.skill_dashboard, matchedSkills, missingSkills),
    ats_analysis: normalizeAtsAnalysis(parsedData.ats_analysis, matchedSkills, missingSkills),
    strengths: normalizeStrengths(parsedData.strengths, matchedSkills),
    improvements: normalizeImprovements(parsedData.improvements, missingSkills)
  };

  renderSummaryHero(data.summary, data.summary_sections);
  renderSummarySections(data.summary_sections);
  renderSummaryEvidenceStrip(data.skill_dashboard, data.ats_analysis);
  renderSidebarStats(data.match_percent, data.skill_dashboard, data.ats_analysis);
  document.getElementById("match-percent").textContent = `${data.match_percent}%`;
  document.getElementById("progress-fill").style.width = `${data.match_percent}%`;

  setOverviewText(data.match_percent);
  renderSkillScore(data.skill_dashboard);
  renderCriticalSkills(data.skill_dashboard);
  renderSkills("matched-skills", data.matched_skills, false);
  renderSkills("missing-skills", data.missing_skills, true);
  renderRecommendedSkills(data.skill_dashboard);
  renderCategoryProgress(data.skill_dashboard);
  renderSkillInsight(data.skill_dashboard);
  renderAtsAnalysis(data.ats_analysis);
  renderJobMatches(data.job_matches);
  renderRoadmap(data.roadmap);
  renderStrengths(data.strengths);
  renderImprovements(data.improvements);
  loadMatchChart(data.match_percent);

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");

      if (button.dataset.tab === "summary") {
        loadMatchChart(data.match_percent);
      }

      if (button.dataset.tab === "skills") {
        loadSkillChart(data);
      }
    });
  });
});
