document.addEventListener("DOMContentLoaded", function () {

  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("resume-upload");
  const fileNameText = document.getElementById("file-name");
  const dropArea = document.getElementById("drop-area");
  const form = document.getElementById("resumeForm");
  const jobDescInput = document.getElementById("job-description");

  const allowedExtensions = ["pdf", "doc", "docx", "txt"];

  // Open file explorer
  browseBtn.addEventListener("click", () => fileInput.click());

  function handleFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert("Upload only PDF, DOC, DOCX, TXT");
      fileInput.value = "";
      fileNameText.textContent = "";
      return false;
    }
    fileNameText.textContent = "Selected file: " + file.name;
    return true;
  }

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.style.borderColor = "#5b6dfa";
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "#bfc6e9";
  });

  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.style.borderColor = "#bfc6e9";
    const file = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    handleFile(file);
  });

  // SUBMIT FORM
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const resumeFile = fileInput.files[0];
    const jobDesc = jobDescInput.value.trim();

    if (!resumeFile) {
      alert("Upload resume");
      return;
    }

    if (!jobDesc) {
      alert("Paste job description");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_desc", jobDesc);

    const response = await fetch("/analyze/", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    localStorage.setItem("analysisResult", JSON.stringify(data));
    window.location.href = "/result/";
  });

});
