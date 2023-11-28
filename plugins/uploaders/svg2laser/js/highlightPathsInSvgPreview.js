let supportedElements = "path, text, rect, ellipse, circle"; //, image";
let unsupportedElements = "";
let passcount = 3;
//define a function that takes an SVG element as an argument and sets the opacity of its child elements to 0
function blinkInvalidElements(svg) {
  if (unsupportedElements.length > 0) {
    // get all the rect, ellipse, circle, and text elements inside the SVG
    const elements = svg.querySelectorAll(unsupportedElements);

    // loop through each element and insert an 'animate' tag that makes the element blink
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // create an 'animate' tag with the necessary attributes
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute("attributeName", "opacity");
      animate.setAttribute("values", "0;.5;0;.5;0;.5;0;.2");
      animate.setAttribute("dur", "3s");
      animate.setAttribute("repeatCount", "1");
      animate.setAttribute("calcMode", "discrete");

      // insert the 'animate' tag into the element
      element.appendChild(animate);
      setStyleAttribute(element, "opacity", "0.2");
      element.setAttribute("class", "invalid_laser_object");
    }
  }
}

function adjustFillAndStroke(svg) {
  const childElements = svg.querySelectorAll(supportedElements);
  for (let i = 0; i < childElements.length; i++) {
    if (childElements[i].tagName == "image") {
      childElements[i].style.opacity = 0.2;
    } else {
      setStyleAttribute(childElements[i], "fill", "none");
      setStyleAttribute(childElements[i], "stroke-width", "1");

      // Check if stroke color is defined in style property
      let strokeColor = childElements[i].style.stroke;

      if (!strokeColor) {
        // First, check for stroke color defined in the stroke attribute
        strokeColor = childElements[i].getAttribute("stroke");
        if (strokeColor) {
          // If found, apply it to the style property
          childElements[i].style.stroke = strokeColor;
        } else {
          // If still not found, check for stroke color defined in the parent's style property
          strokeColor = childElements[i].parentElement.style.stroke;
          if (strokeColor) {
            childElements[i].style.stroke = strokeColor;
          }
        }
      }
      // adjust bounding box so we just see what's there
      var bbox = svg.getBBox();
      let margin = 5;
      svg.setAttribute("viewBox", [bbox.x - margin, bbox.y - margin, bbox.width + margin, bbox.height + margin].join(" "));
    }
  }
}

function hideAllButOneColorPath(svg, rgb) {
  const childElements = svg.querySelectorAll(supportedElements);
  for (let i = 0; i < childElements.length; i++) {
    const childElement = childElements[i];
    const strokeColor = childElement.style.stroke;
    const isMatchingColor = compareColors(strokeColor, rgb);
    if (isMatchingColor) {
      childElement.style.opacity = "1";
    } else {
      childElement.style.opacity = "0.2";
    }
  }
}
function revealAllPaths(svg, rgb) {
  const childElements = svg.querySelectorAll(supportedElements);
  for (let i = 0; i < childElements.length; i++) {
    if (!childElements[i].getAttribute("class") || childElements[i].getAttribute("class") != "invalid_laser_object") {
      childElements[i].style.opacity = "1";
    }
  }
}

function compareColors(color1, color2) {
  // parse rgb() value and convert to hex value
  function parseRgbToHex(color) {
    let parts = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (parts) {
      delete parts[0];
      for (let i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16).padStart(2, "0");
      }
      return "#" + parts.join("");
    }
    return color;
  }

  // normalize colors to hex values
  color1 = parseRgbToHex(color1);
  color2 = parseRgbToHex(color2);

  return color1 === color2;
}

function setStyleAttribute(node, attribute, value) {
  let styleAttr = node.getAttribute("style");
  if (!styleAttr) {
    styleAttr = "";
  } else if (!styleAttr.includes(attribute + ":")) {
    styleAttr += attribute + ": ;";
  }
  const regex1 = new RegExp(`${attribute}:[^;]+;`);
  styleAttr = styleAttr.replace(regex1, `${attribute}: ${value};`);
  const regex2 = new RegExp(`${attribute}:[^;]+$`);
  styleAttr = styleAttr.replace(regex2, `${attribute}: ${value};`); //incase the attrribute is the last one there
  if (styleAttr.slice(-1) != ";") styleAttr += ";";
  node.setAttribute("style", styleAttr);
}

// define a function that sets up an intersection observer to watch for SVG elements being added to the DOM
function watchForSvgElements() {
  //wait for the document to fully load before attaching an event listener
  document.addEventListener("DOMContentLoaded", function () {
    // create a new MutationObserver instance
    const observer = new MutationObserver(function (mutationsList) {
      // loop through each mutation that has been observed
      for (let mutation of mutationsList) {
        // check if an SVG element has been added to the DOM
        if (mutation.type === "childList") {
          let addedNodes = mutation.addedNodes;
          for (let node of addedNodes) {
            if (node.nodeName === "svg") {
              // console.log("dom modified");
              processSVG();
            }
          }
        }
      }
    });

    // start observing the DOM for changes
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function processSVG() {
  const svg = document.querySelector("#svg-container svg");
  if (svg) {
    // adjust the fill and stroke of path elements in the SVG
    adjustFillAndStroke(svg);
    blinkInvalidElements(svg);
    setupTableObserver(svg);
    watchForNewRows();
  }
}
function addRow() {
  const svg = document.querySelector("#svg-container svg");
  if (svg) {
    let rows = document.querySelectorAll(".pass-settings");
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const colorPicker = row.querySelector(".sp-preview-inner");
        const rgbColor = getComputedStyle(colorPicker).getPropertyValue("background-color");
        // console.log(rgbColor);
        hideAllButOneColorPath(svg, rgbColor);
      });
      row.addEventListener("mouseleave", () => {
        // console.log("revealing all paths");
        revealAllPaths(svg);
      });
    });
    console.log("ran table observer setup");
  }
}

function setupTableObserver(svg) {
  let rows = document.querySelectorAll(".pass-settings");
  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const colorPicker = row.querySelector(".sp-preview-inner");
      const rgbColor = getComputedStyle(colorPicker).getPropertyValue("background-color");
      // console.log(rgbColor);
      hideAllButOneColorPath(svg, rgbColor);
    });
    row.addEventListener("mouseleave", () => {
      // console.log("revealing all paths");
      revealAllPaths(svg);
    });
  });
  console.log("ran table observer setup");
}

function watchForNewRows() {
  setTimeout(function () {
    document.getElementById("passes").addEventListener(
      "DOMNodeInserted",
      (event) => {
        //add small delay so the dom an fully update after adding element
        setTimeout(() => addRow(), 20);
      },
      false
    );
  }, 20);
  //likewise there is a small delay after loading the svg
}
// call the watchForSvgElements function to start watching for SVG elements being added to the DOM
// watchForSvgElements();
processSVG();
