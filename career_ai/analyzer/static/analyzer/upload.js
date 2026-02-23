document.addEventListener("DOMContentLoaded", function () {
  console.log("upload.js loaded ✅");

  // Elements
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("resume-upload");
  const fileNameText = document.getElementById("file-name");
  const dropArea = document.getElementById("drop-area");
  const form = document.getElementById("resumeForm");
  const jobDescInput = document.getElementById("job-description");

  if (!browseBtn || !fileInput || !form) {
    console.error("❌ Required upload elements not found");
    return;
  }

  const allowedExtensions = ["pdf", "doc", "docx", "txt"];

  // ========================
  // OPEN FILE EXPLORER
  // ========================
  browseBtn.addEventListener("click", function () {
    fileInput.click();
  });

  // ========================
  // FILE VALIDATION
  // ========================
  function handleFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      alert("❌ Invalid file type.\nAllowed: PDF, DOC, DOCX, TXT");
      fileInput.value = "";
      fileNameText.textContent = "";
      return false;
    }

    fileNameText.textContent = "Selected file: " + file.name;
    return true;
  }

  // ========================
  // FILE SELECT (BROWSE)
  // ========================
  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  // ========================
  // DRAG & DROP
  // ========================
  dropArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropArea.style.borderColor = "#5b6dfa";
  });

  dropArea.addEventListener("dragleave", function () {
    dropArea.style.borderColor = "#bfc6e9";
  });

  dropArea.addEventListener("drop", function (e) {
    e.preventDefault();
    dropArea.style.borderColor = "#bfc6e9";

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;
      handleFile(file);
    }
  });

  // ========================
  // FORM SUBMIT → DJANGO
  // ========================
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const resumeFile = fileInput.files[0];
    const jobDesc = jobDescInput.value.trim();

    if (!resumeFile) {
      alert("⚠️ Please upload a resume file");
      return;
    }

    if (!jobDesc) {
      alert("⚠️ Please paste job description");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_desc", jobDesc);

    try {
      const response = await fetch("/analyze/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      // Save result for result.html
      localStorage.setItem("analysisResult", JSON.stringify(data));

      // Redirect to result page
      window.location.href = "/result/";

    } catch (error) {
      console.error(error);
      alert("❌ Error analyzing resume. Try again.");
    }
  });
});
