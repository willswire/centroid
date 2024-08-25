document.addEventListener("DOMContentLoaded", function () {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("fileInput");

  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      () => dropArea.classList.add("highlight"),
      false,
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      () => dropArea.classList.remove("highlight"),
      false,
    );
  });

  // Handle dropped files
  dropArea.addEventListener("drop", handleDrop, false);

  // Trigger file input when clicking anywhere in drop area
  dropArea.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener("change", handleFiles, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
  }

  function handleFiles(e) {
    const files = e.target.files;
    if (files.length > 0 && files[0].type === "image/svg+xml") {
      const file = files[0];
      processFile(file); // Call to process the SVG file
    } else {
      displayMessage("Please upload a valid SVG file.", true);
    }
  }

  function processFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const svgContent = e.target.result;
      processSVG(svgContent); // Call the processSVG function from center.js
    };

    reader.onerror = function () {
      console.error("Error reading file");
      displayMessage("Error reading file", true);
    };

    reader.readAsText(file);
  }
});
