const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("resume-upload");
const browseBtn = document.querySelector(".browse-btn");

browseBtn.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#5b6dfa";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.borderColor = "#bfc6e9";
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#bfc6e9";
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
  }
});