document
  .getElementById("fileInput")
  .addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (file && file.type === "image/svg+xml") {
    const reader = new FileReader();

    reader.onload = function (e) {
      console.log("File loaded successfully.");
      const svgContent = e.target.result;
      processSVG(svgContent);
    };

    reader.onerror = function () {
      console.error("Error reading file");
      displayMessage("Error reading file", true);
    };

    reader.readAsText(file);
  } else {
    displayMessage("Please upload a valid SVG file.", true);
  }
}

function processSVG(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");

  const pathElements = doc.querySelectorAll("path");
  console.log(`Found ${pathElements.length} path elements.`);

  if (!pathElements.length) {
    displayMessage("The SVG does not contain a valid path.", true);
    return;
  }

  const pointPairs = [];

  pathElements.forEach((pathElement, index) => {
    console.log(`Processing path element ${index + 1}`);
    normalizePath(pathElement);
    const pathData = pathElement.getPathData();

    pathData.forEach((seg) => {
      if (seg.type !== "Z") {
        for (let i = 0; i < seg.values.length; i += 2) {
          pointPairs.push([seg.values[i], seg.values[i + 1]]);
        }
      }
    });
  });

  if (!pointPairs.length) {
    displayMessage("No valid points found in the SVG paths.", true);
    return;
  }

  pointPairs.push(pointPairs[0]); // Close the loop

  const centroid = calculateCentroid(pointPairs);
  console.log(`Calculated centroid at: (${centroid.x}, ${centroid.y})`);
  createNewSVGWithCentroid(doc, centroid);
}

function normalizePath(path) {
  const normalizedPathData = path.getPathData({ normalize: true });
  path.setPathData(normalizedPathData);
  console.log("Normalized path data");
}

function calculateCentroid(points) {
  let x = 0,
    y = 0,
    area = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const [xi, yi] = points[i];
    const [xi1, yi1] = points[i + 1];
    const a = xi * yi1 - xi1 * yi;
    area += a;
    x += (xi + xi1) * a;
    y += (yi + yi1) * a;
  }

  area *= 0.5;

  if (area === 0 || !area) {
    console.error("Area calculation resulted in zero or invalid.");
    return { x: NaN, y: NaN };
  }

  x /= 6 * area;
  y /= 6 * area;

  return { x, y };
}

function createNewSVGWithCentroid(doc, centroid) {
  const svgNS = "http://www.w3.org/2000/svg";

  const newSVG = document.createElementNS(svgNS, "svg");
  newSVG.setAttribute("width", 120);
  newSVG.setAttribute("height", 120);
  newSVG.setAttribute("viewBox", "0 0 120 120");
  newSVG.setAttribute("style", "border: 1px solid black;");

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", 60);
  circle.setAttribute("cy", 60);
  circle.setAttribute("r", 30);
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "black");

  const offsetX = 60 - centroid.x;
  const offsetY = 60 - centroid.y;

  const paths = doc.querySelectorAll("path");
  paths.forEach((pathElement) => {
    const newPath = pathElement.cloneNode(true);

    newPath.setPathData(
      newPath.getPathData().map((seg) => {
        if (seg.type !== "Z") {
          for (let i = 0; i < seg.values.length; i += 2) {
            seg.values[i] += offsetX;
            seg.values[i + 1] += offsetY;
          }
        }
        return seg;
      }),
    );

    newSVG.appendChild(newPath);
  });

  newSVG.appendChild(circle);

  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";
  outputDiv.appendChild(newSVG);

  displayMessage("Centroid successfully calculated and displayed.", false);
}

function displayMessage(message, isError = false) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.className = isError ? "error" : "";
  console.log(message);
}

// Polyfill for getPathData() and setPathData()
class SVGPathDataPolyfill {
  constructor() {
    this.init();
  }

  init() {
    if (typeof SVGPathElement.prototype.getPathData !== "function") {
      Object.assign(SVGPathElement.prototype, {
        getPathData: function (options = {}) {
          const pathSegList = this.pathSegList;
          const pathData = [];

          for (let i = 0, len = pathSegList.numberOfItems; i < len; i++) {
            const segment = pathSegList.getItem(i);
            const type = segment.pathSegTypeAsLetter;

            let values = [];
            if (segment.x !== undefined) values.push(segment.x);
            if (segment.y !== undefined) values.push(segment.y);
            if (segment.x1 !== undefined) values.push(segment.x1);
            if (segment.y1 !== undefined) values.push(segment.y1);
            if (segment.x2 !== undefined) values.push(segment.x2);
            if (segment.y2 !== undefined) values.push(segment.y2);

            pathData.push({ type, values });
          }

          return pathData;
        },

        setPathData: function (pathData) {
          const pathSegList = this.pathSegList;
          pathSegList.clear();

          pathData.forEach((seg) => {
            const { values } = seg;

            switch (seg.type) {
              case "M":
                pathSegList.appendItem(
                  this.createSVGPathSegMovetoAbs(values[0], values[1]),
                );
                break;
              case "L":
                pathSegList.appendItem(
                  this.createSVGPathSegLinetoAbs(values[0], values[1]),
                );
                break;
              case "C":
                pathSegList.appendItem(
                  this.createSVGPathSegCurvetoCubicAbs(
                    values[0],
                    values[1],
                    values[2],
                    values[3],
                    values[4],
                    values[5],
                  ),
                );
                break;
              case "Z":
                pathSegList.appendItem(this.createSVGPathSegClosePath());
                break;
              // Add other cases as needed
            }
          });
        },
      });
    }
  }
}

new SVGPathDataPolyfill();
