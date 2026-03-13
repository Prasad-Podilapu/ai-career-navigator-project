document.addEventListener("DOMContentLoaded", function () {
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("resume-upload");
  const fileNameText = document.getElementById("file-name");
  const dropArea = document.getElementById("drop-area");
  const form = document.getElementById("resumeForm");
  const jobDescInput = document.getElementById("job-description");
  const analyzeBtn = document.getElementById("analyze-btn");
  const statusText = document.getElementById("form-status");

  if (!browseBtn || !fileInput || !dropArea || !form || !jobDescInput || !analyzeBtn || !statusText) {
    console.error("Required upload elements not found.");
    return;
  }

  const allowedExtensions = ["pdf", "doc", "docx", "txt"];

  function setStatus(message, isError) {
    statusText.textContent = message;
    statusText.style.color = isError ? "#c62828" : "#344054";
  }

  function setSubmittingState(isSubmitting) {
    analyzeBtn.disabled = isSubmitting;
    analyzeBtn.textContent = isSubmitting ? "Analyzing..." : "Analyze Resume";
  }

  function handleFile(file) {
    if (!file) {
      return false;
    }

    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setStatus("Invalid file type. Allowed: PDF, DOC, DOCX, TXT.", true);
      fileInput.value = "";
      fileNameText.textContent = "";
      return false;
    }

    fileNameText.textContent = "Selected file: " + file.name;
    setStatus("", false);
    return true;
  }

  browseBtn.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  dropArea.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropArea.style.borderColor = "#5b6dfa";
  });

  dropArea.addEventListener("dragleave", function () {
    dropArea.style.borderColor = "#bfc6e9";
  });

  dropArea.addEventListener("drop", function (event) {
    event.preventDefault();
    dropArea.style.borderColor = "#bfc6e9";

    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      fileInput.files = event.dataTransfer.files;
      handleFile(file);
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    setStatus("", false);

    const resumeFile = fileInput.files[0];
    const jobDesc = jobDescInput.value.trim();

    if (!resumeFile) {
      setStatus("Please upload a resume file.", true);
      return;
    }

    if (!handleFile(resumeFile)) {
      return;
    }

    if (!jobDesc) {
      setStatus("Please paste a job description.", true);
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_desc", jobDesc);

    setSubmittingState(true);
    setStatus("Analyzing your resume. Please wait...", false);

    try {
      const response = await fetch("/analyze/", {
        method: "POST",
        body: formData
      });

      let data = null;
      const responseType = response.headers.get("content-type") || "";

      if (responseType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(rawText || "The server returned a non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "The server could not analyze the resume.");
      }

      localStorage.setItem("analysisResult", JSON.stringify(data));
      window.location.href = "/result/";
    } catch (error) {
      console.error("Analyze request failed:", error);
      setStatus(error.message || "Error analyzing resume. Try again.", true);
    } finally {
      setSubmittingState(false);
    }
  });
});
