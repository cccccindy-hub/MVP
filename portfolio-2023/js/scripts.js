/**
 * Mobile Menu Toggle
 *
 * Toggles the mobile menu, overlay, and body scroll on click of the menu toggle button.
 * Ensures the menu and overlay open/close smoothly and prevents body scroll when the menu is open.
 *
 */
if (document.querySelector(".mobile-menu")) {
  const menu = document.querySelector(".mobile-menu");
  const menuToggleButton = document.querySelector(".mobile-menu-toggle");
  const body = document.querySelector("body");
  const overlay = document.querySelector(".mob-overlay");

  menuToggleButton.addEventListener("click", function () {
    menu.classList.toggle("open");
    overlay.classList.toggle("open");
    menuToggleButton.classList.toggle("close");
    body.classList.toggle("scroll");
  });
}

/**
 * Home Page Banner - Day/Night Mode Toggle
 *
 * Toggles between day and night modes based on the button click and saves the mode in local storage.
 * Automatically sets the initial mode based on the saved preference in local storage.
 *
 */
const toggleButton = document.getElementById("toggleButton");
const body = document.body;
let currentMode = localStorage.getItem("mode");

// Checks local storage for time of day
if (currentMode === "nighttime") {
  body.classList.add("nighttime");
  toggleButton.classList.add("daytime");
  toggleButton.classList.remove("nighttime");
} else {
  localStorage.setItem("mode", "daytime");
  body.classList.remove("nighttime");
  toggleButton.classList.add("nighttime");
  toggleButton.classList.remove("daytime");
}

// On click of time of day button, switch between day or night
toggleButton.addEventListener("click", () => {
  body.classList.toggle("nighttime");
  currentMode = localStorage.getItem("mode");

  if (currentMode === "nighttime") {
    localStorage.setItem("mode", "daytime");
  } else {
    localStorage.setItem("mode", "nighttime");
  }

  toggleButton.classList.toggle("daytime");
  toggleButton.classList.toggle("nighttime");
});

/**
 * Function to apply random values to elements for animations
 *
 * Applies a random value to a CSS variable for each selected element.
 * This random value can be used to create dynamic animations in CSS.
 *
 */
function applyRandomValueToElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.style.setProperty("--random-value", Math.random());
  });
}

// Apply random values to specific elements
applyRandomValueToElements("#trees-left .cls-4");
applyRandomValueToElements("#trees-right .cls-4");
applyRandomValueToElements("#trees-3 .cls-7");
applyRandomValueToElements("#stars .cls-11");

/**
 * Update hero background viewBox based on screen width
 *
 * Updates the viewBox attribute of an SVG element to ensure it looks good on different screen widths.
 * Uses a media query to determine the appropriate viewBox values.
 *
 */
const mediaQuery = window.matchMedia("(max-width: 768px)");
const svgElement = document.getElementById("mountains-bg");

function updateViewBox() {
  if (mediaQuery.matches) {
    svgElement.setAttribute("viewBox", "700 0 992 850");
  } else {
    svgElement.setAttribute("viewBox", "0 0 1920 850");
  }
}

if (svgElement) {
  mediaQuery.addEventListener("change", updateViewBox);
  updateViewBox();
}

/**
 * Parallax hero background effect
 *
 * Creates a parallax scrolling effect by updating a CSS variable with the scroll position.
 * This variable can be used in CSS to create a parallax effect on the hero background.
 *
 */
const scrollEl = document.documentElement;
const root = document.documentElement;

let scrollPos;

// Update css property on scroll
function animation() {
  // Check the scroll position has changed
  if (scrollPos !== scrollEl.scrollTop) {
    // Reset the seen scroll position
    scrollPos = scrollEl.scrollTop;
    // Update css property --scrollPos with scroll position in pixels
    root.style.setProperty("--scrollPos", scrollPos + "px");
  }

  // Call animation again on next animation frame
  window.requestAnimationFrame(animation);
}

// Start animation on next animation frame
window.requestAnimationFrame(animation);

/**
 * Function to update the copyright year dynamically
 *
 * Updates the text content of the copyright element with the current year.
 * Ensures the displayed year is always up-to-date.
 *
 */
function updateCopyrightYear() {
  const year = new Date().getFullYear();
  const copyrightElement = document.getElementById("copyright");

  // Ensure the element exists before attempting to update its content
  if (copyrightElement) {
    copyrightElement.textContent = `© ${year} Nick Tesh - All Rights Reserved.`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCopyrightYear();
});

/**
 * Function to close the mobile menu and overlay
 *
 * Closes the mobile menu and overlay, and enables body scrolling.
 * Removes the appropriate classes from the relevant elements.
 *
 */
function closeMobileMenu() {
  document.querySelectorAll(".mobile-menu, .mob-overlay, .mobile-menu-toggle, body").forEach((el) => {
    el.classList.remove(el.matches(".mobile-menu, .mob-overlay") ? "open" : el.matches(".mobile-menu-toggle") ? "close" : "scroll");
  });
}

// Close Mobile Menu after clicking anchor link
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".mobile-menu ul li a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
});

/**
 * This script adds smooth scrolling behavior to anchor links on the portfolio page.
 * When an anchor link is clicked, the page will smoothly scroll to the corresponding section.
 *
 */
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll('a[href*="#"]');

  links.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      const targetId = this.getAttribute("href").split("#")[1];
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: "smooth",
        });

        // Update the URL hash without jumping to the section
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });
});

/**
 * This script sets up a series of Highcharts polar column charts to display proficiency levels
 * across various categories including Front-End, Back-End, Tools & Platforms, and Design & Accessibility.
 *
 * - `retroColors`: An array of hex color codes used to style the chart series.
 * - `generateSeriesData`: A function to map proficiency data to the chart series, assigning colors from `retroColors`.
 * - `sharedChartOptions`: A common set of chart options to ensure consistency across all charts.
 * - `createChart`: A function to initialize a Highcharts chart with provided container, title, categories, and data.
 * - `chartData`: An array of objects containing the configuration data for each chart (container, title, categories, data).
 * - Initialization: Iterates over `chartData` to create each chart using the `createChart` function.
 *
 */
const retroColors = ["#ef6262", "#f3ac74", "#e3c78a", "#98c1d9", "#5e81ac", "#d08770", "#a3be8c", "#b48ead"];

// Function to generate series data with colors
const generateSeriesData = (data) => {
  return data.map((value, index) => ({
    y: value,
    color: retroColors[index % retroColors.length],
  }));
};

// Shared chart options
const sharedChartOptions = {
  chart: {
    polar: true,
    type: "column",
    backgroundColor: "transparent",
  },
  pane: {
    size: "85%",
  },
  yAxis: {
    min: 0,
    max: 10,
    tickInterval: 1,
    endOnTick: false,
    showLastLabel: true,
    labels: {
      enabled: false,
    },
    gridLineInterpolation: "polygon",
    title: {
      text: null,
    },
  },
  credits: {
    enabled: false,
  },
  legend: {
    enabled: false,
  },
  tooltip: {
    enabled: false,
  },
  responsive: {
    rules: [
      {
        condition: {
          maxWidth: 600,
        },
        chartOptions: {
          pane: {
            size: "70%",
          },
          xAxis: {
            labels: {
              style: {
                fontSize: "10px",
              },
            },
          },
        },
      },
    ],
  },
};

// Function to create chart
const createChart = (container, title, categories, data) => {
  Highcharts.chart(container, {
    ...sharedChartOptions,
    title: {
      text: title,
      style: {
        color: "#202020",
      },
    },
    xAxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: "15px",
          fontWeight: "700",
          fontFamily: "Cabin, sans-serif",
          color: "#202020",
        },
        distance: 25,
      },
      tickmarkPlacement: "on",
      lineWidth: 0,
    },
    series: [
      {
        name: "Proficiency Level",
        data: generateSeriesData(data),
        pointPlacement: "on",
        dataLabels: {
          enabled: true,
          align: "center",
          verticalAlign: "middle",
          inside: true,
          style: {
            fontSize: "14px",
            fontWeight: "bold",
            color: "#202020",
          },
          formatter: function () {
            return this.y;
          },
          overflow: "none",
          crop: false,
          allowOverlap: true,
        },
      },
    ],
  });
};

// Data for charts
const chartData = [
  {
    container: "frontendChart",
    title: "Front-End",
    categories: ["HTML/CSS", "SCSS", "JavaScript", "React", "jQuery", "Bootstrap", "Chart.js", "Highcharts"],
    data: [10, 10, 9, 7, 8, 10, 7, 7],
  },
  {
    container: "backendChart",
    title: "Back-End",
    categories: ["PHP", "Node.js", "MySQL", "MongoDB", "Puppeteer"],
    data: [9, 7, 8, 5, 8],
  },
  {
    container: "toolsChart",
    title: "Tools & Platforms",
    categories: ["Git", "GitHub", "AWS", "Docker"],
    data: [8, 9, 7, 5],
  },
  {
    container: "designChart",
    title: "Design & Accessibility",
    categories: ["Figma", "Adobe Suite", "ADA Standards", "WCAG 2.2", "SEO"],
    data: [10, 10, 9, 9, 8],
  },
];

// Create all charts
chartData.forEach(({ container, title, categories, data }) => {
  createChart(container, title, categories, data);
});

/**
 * Fetches project data and dynamically generates project cards and modals.
 *
 * This script waits for the DOM content to be fully loaded, then:
 * 1. Fetches project data from a `projects.json` file.
 * 2. Creates and appends project cards to the `projects-container`.
 * 3. Creates and appends corresponding modals to the `modal-container` upon clicking a card.
 * 4. Adds event listeners for opening and closing the modals.
 * 5. Enables closing modals by clicking outside the modal content.
 * 6. Traps focus within the modal when it is open.
 * 7. Disables body scrolling when a modal is open.
 *
 */
document.addEventListener("DOMContentLoaded", () => {
  let projectsData = [];

  fetch("projects.json")
    .then((response) => response.json())
    .then((data) => {
      projectsData = data;
      const projectsContainer = document.getElementById("projects-container");

      data.forEach((project) => {
        // Create project card
        const card = document.createElement("div");
        card.classList.add("col-lg-4", "col-md-6");
        card.innerHTML = `
          <div class="card-wrapper" data-project-id="${project.id}" tabindex="0" role="button" aria-pressed="false">
            <div class="image-wrapper">
              <figure>
                <img src="${project.image}" alt="${project.title}" />
              </figure>
            </div>
            <div class="multi-colored-bar">
              <div class="color-segment color1"></div>
              <div class="color-segment color2"></div>
              <div class="color-segment color3"></div>
              <div class="color-segment color4"></div>
              <div class="color-segment color5"></div>
            </div>
            <div class="content-wrapper">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <div class="content-tags">
                ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
            </div>
          </div>
        `;
        projectsContainer.appendChild(card);
      });

      // Event listeners for opening modals
      document.querySelectorAll(".card-wrapper").forEach((card) => {
        card.addEventListener("click", (event) => {
          const projectId = card.getAttribute("data-project-id");
          openModal(projectId);
        });

        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            const projectId = card.getAttribute("data-project-id");
            openModal(projectId);
          }
        });
      });
    })
    .catch((error) => console.error("Error fetching project data:", error));

  // Function to open the modal and lazy load images
  function openModal(projectId) {
    const project = projectsData.find((p) => p.id === projectId);
    const modalContainer = document.getElementById("modal-container");
    const body = document.body;

    // Create project modal
    const dialog = document.createElement("dialog");
    dialog.classList.add("dialog");
    dialog.setAttribute("id", `${project.id}-modal`);
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("role", "dialog");
    dialog.innerHTML = `
      <div class="dialog-header">
        <button class="close" data-project-id="${project.id}" aria-label="Close">&times;</button>
      </div>
      <div class="dialog-content">
        <span class="scroll-indicator">Scroll down to see full project details</span>
        <div class="multi-colored-bar">
          <div class="color-segment color1"></div>
          <div class="color-segment color2"></div>
          <div class="color-segment color3"></div>
          <div class="color-segment color4"></div>
          <div class="color-segment color5"></div>
        </div>
        <h2>${project.title}</h2>
        <p>${project.overview}</p>
        ${
          project.roleText
            ? `
          <div class="multi-colored-bar">
            <div class="color-segment color1"></div>
            <div class="color-segment color2"></div>
            <div class="color-segment color3"></div>
            <div class="color-segment color4"></div>
            <div class="color-segment color5"></div>
          </div>
          <h3>My Role</h3>
          <p>${project.roleText}</p>
          <ul>${project.roles.map((role) => `<li>${role}</li>`).join("")}</ul>
          `
            : ""
        }
        <div class="multi-colored-bar">
          <div class="color-segment color1"></div>
          <div class="color-segment color2"></div>
          <div class="color-segment color3"></div>
          <div class="color-segment color4"></div>
          <div class="color-segment color5"></div>
        </div>
        <h3>Technologies Used</h3>
        <ul>${project.technologies.map((tech) => `<li>${tech}</li>`).join("")}</ul>
        <div class="multi-colored-bar">
          <div class="color-segment color1"></div>
          <div class="color-segment color2"></div>
          <div class="color-segment color3"></div>
          <div class="color-segment color4"></div>
          <div class="color-segment color5"></div>
        </div>
        ${project.highlights.length ? `<h3>Project Highlights</h3><ul>${project.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}</ul>` : ""}
        <div class="btn-wrapper">
          ${project.githubLink ? `<a href="${project.githubLink}" class="primary-btn" target="_blank">VIEW GITHUB REPO</a>` : ""}
          <div class="btn-text">
            ${project.liveSiteText ? `<p><strong>${project.liveSiteText}</strong></p>` : ""}
            ${project.liveSite ? `<a href="${project.liveSite}" class="primary-btn" target="_blank">VISIT SITE</a>` : ""}
          </div>
        </div>
        <div class="multi-colored-bar">
          <div class="color-segment color1"></div>
          <div class="color-segment color2"></div>
          <div class="color-segment color3"></div>
          <div class="color-segment color4"></div>
          <div class="color-segment color5"></div>
        </div>
        ${
          project.screenshots.length
            ? `<h3>Screenshots from Live Site</h3>${project.screenshots
                .map(
                  (screenshot) => `
          <div class="img-wrapper">
            <h4>${screenshot.title}</h4>
            <img data-src="${screenshot.src}" alt="${screenshot.title}" width="${screenshot.width}"/>
          </div>`
                )
                .join("")}`
            : ""
        }
      </div>
    `;
    modalContainer.appendChild(dialog);

    dialog.showModal();

    // Lazy load images in the modal
    dialog.querySelectorAll("img[data-src]").forEach((img) => {
      img.setAttribute("src", img.getAttribute("data-src"));
      img.removeAttribute("data-src");
    });

    // Add class to disable body scroll
    body.classList.add("modal-open");

    // Trap focus inside the modal
    trapFocus(dialog);

    // Event listener for closing modals
    dialog.querySelector(".close").addEventListener("click", () => {
      dialog.close();
      body.classList.remove("modal-open");
      dialog.remove();
    });

    // Close modal when clicking outside of the modal content
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
        body.classList.remove("modal-open");
        dialog.remove();
      }
    });
  }

  // Trap focus within the modal
  function trapFocus(modal) {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
    const focusableContent = modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    document.addEventListener("keydown", function (e) {
      let isTabPressed = e.key === "Tab" || e.keyCode === 9;

      if (!isTabPressed) {
        return;
      }

      if (e.shiftKey) {
        // if shift key pressed for shift + tab combination
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus(); // add focus for the last focusable element
          e.preventDefault();
        }
      } else {
        // if tab key is pressed
        if (document.activeElement === lastFocusableElement) {
          // if focused has reached to last focusable element then focus first focusable element after pressing tab
          firstFocusableElement.focus(); // add focus for the first focusable element
          e.preventDefault();
        }
      }
    });
  }
});
