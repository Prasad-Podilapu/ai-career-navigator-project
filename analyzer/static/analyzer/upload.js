document.addEventListener("DOMContentLoaded", function () {
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("resume-upload");
  const fileNameText = document.getElementById("file-name");
  const dropArea = document.getElementById("drop-area");
  const form = document.getElementById("resumeForm");
  const jobDescInput = document.getElementById("job-description");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (!browseBtn || !fileInput || !fileNameText || !dropArea || !form || !jobDescInput || !analyzeBtn) {
    console.error("Required upload elements not found.");
    return;
  }

  const allowedExtensions = ["pdf", "doc", "docx", "txt"];

  function setLoading(loading) {
    analyzeBtn.disabled = loading;
    analyzeBtn.textContent = loading ? "Analyzing..." : "Analyze Resume";
  }

  function showAlert(message, type) {
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = document.querySelector(".upload-box");
    if (container) {
      container.insertBefore(alert, container.firstChild);
    }
  }

  function validateFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      showAlert("Please upload only PDF, DOC, DOCX, or TXT files.", "error");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      showAlert("File size must be less than 10MB.", "error");
      return false;
    }

    return true;
  }

  function handleFile(file) {
    if (!file) {
      return false;
    }

    if (!validateFile(file)) {
      fileInput.value = "";
      fileNameText.textContent = "";
      return false;
    }

    fileNameText.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
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
    dropArea.classList.add("dragover");
  });

  dropArea.addEventListener("dragleave", function () {
    dropArea.classList.remove("dragover");
  });

  dropArea.addEventListener("drop", function (event) {
    event.preventDefault();
    dropArea.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFile(files[0]);
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const resumeFile = fileInput.files[0];
    const jobDesc = jobDescInput.value.trim();

    if (!resumeFile) {
      showAlert("Please select a resume file.", "error");
      return;
    }

    if (!handleFile(resumeFile)) {
      return;
    }

    if (!jobDesc) {
      showAlert("Please enter a job description.", "error");
      return;
    }

    if (jobDesc.length < 50) {
      showAlert("Job description should be at least 50 characters.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_desc", jobDesc);

    setLoading(true);

    try {
      const response = await fetch("/analyze/", {
        method: "POST",
        body: formData
      });

      const responseType = response.headers.get("content-type") || "";
      let payload = null;

      if (responseType.includes("application/json")) {
        payload = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(rawText || "The server returned a non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed.");
      }

      localStorage.setItem("analysisResult", JSON.stringify(payload));
      showAlert("Analysis completed successfully.", "success");

      setTimeout(function () {
        window.location.href = "/result/";
      }, 600);
    } catch (error) {
      console.error("Analysis error:", error);
      showAlert(error.message || "An error occurred during analysis.", "error");
    } finally {
      setLoading(false);
    }
  });
});
