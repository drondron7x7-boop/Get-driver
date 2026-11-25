
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".scene")];
  const template = document.getElementById("mascotTemplate");
  const previousButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  const nextLabel = document.getElementById("nextLabel");
  const nextArrow = document.getElementById("nextArrow");
  const replayButton = document.getElementById("replayButton");
  const dotsContainer = document.getElementById("sceneDots");
  const progressFill = document.getElementById("progressFill");
  const viewport = document.getElementById("viewport");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (
    !scenes.length ||
    !template ||
    !previousButton ||
    !nextButton ||
    !nextLabel ||
    !nextArrow ||
    !replayButton ||
    !dotsContainer ||
    !progressFill ||
    !viewport
  ) {
    console.error("Faltan elementos necesarios para iniciar Get Driver.");
    return;
  }

  const driverAppUrl =
    "https://play.google.com/store/apps/details?id=com.getdriver.conductor&pcampaignid=web_share";

  const driverAppLink = document.getElementById("driverAppLink");

  if (driverAppLink && /^https?:\/\//i.test(driverAppUrl)) {
    driverAppLink.href = driverAppUrl;
    driverAppLink.target = "_blank";
    driverAppLink.rel = "noopener noreferrer";
    driverAppLink.classList.remove("is-pending");
    driverAppLink.removeAttribute("aria-disabled");
    driverAppLink.removeAttribute("tabindex");
  }

  const gifFiles = [
    "assets/mascota/alex-saluda-derecha.gif",
    "assets/mascota/alex-explica-izquierda.gif",
    "assets/mascota/alex-habla-derecha.gif",
    "assets/mascota/alex-habla-izquierda.gif",
    "assets/mascota/alex-aprueba-derecha.gif",
    "assets/mascota/alex-explica-izquierda.gif",
    "assets/mascota/alex-habla-derecha.gif",
    "assets/mascota/alex-habla-izquierda.gif",
    "assets/mascota/alex-saluda-derecha.gif"
  ];

  scenes.forEach((scene, index) => {
    scene.dataset.gif = gifFiles[index];
  });

  let sceneIndex = 0;
  let version = 0;
  let timers = [];
  let typingTimer = null;
  let touchStart = null;

  scenes.forEach(scene => {
    const guide = template.content.firstElementChild.cloneNode(true);
    const image = guide.querySelector(".mascot-image");
    const pose = guide.querySelector(".mascot-pose");

    image.alt = `Alex de Get Driver: ${
      scene.querySelector("h1,h2")?.textContent.trim() || "guía"
    }`;

    image.addEventListener("load", () => {
      pose.classList.toggle("has-image", image.naturalWidth > 0);

      if (scene.classList.contains("is-active")) {
        alignDialogue(scene);
      }
    });

    image.addEventListener("error", () => {
      pose.classList.remove("has-image");

      const notice = guide.querySelector(".mascot-placeholder small");

      if (notice) {
        notice.textContent =
          `NO SE ENCONTRÓ: ${scene.dataset.gif.split("/").pop()}`;
      }

      console.error("No se pudo cargar el GIF:", scene.dataset.gif);
    });

    scene.querySelector(".scene-shell").prepend(guide);
  });

  function loadMascot(scene) {
    const image = scene.querySelector(".mascot-image");

    if (!image || image.dataset.requested === "true") {
      return;
    }

    image.dataset.requested = "true";

    image.src = `${scene.dataset.gif}?v=alex-gifs-corregidos-6`;

    if (image.complete && image.naturalWidth > 0) {
      image.closest(".mascot-pose").classList.add("has-image");
    }
  }

  function alignDialogue(scene) {
    if (!scene.classList.contains("is-active")) {
      return;
    }

    const guide = scene.querySelector(".guide");
    const bubble = guide?.querySelector(".speech");
    const image = guide?.querySelector(".mascot-image");
    const placeholder = guide?.querySelector(".placeholder-head");

    if (!guide || !bubble) {
      return;
    }

    const area = guide.getBoundingClientRect();
    let mouthY = area.height * .4;

    const imageLoaded =
      image &&
      image.naturalWidth > 0 &&
      image.closest(".mascot-pose")?.classList.contains("has-image");

    if (imageLoaded) {
      const box = image.getBoundingClientRect();

      const ratio = Math.min(
        box.width / image.naturalWidth,
        box.height / image.naturalHeight
      );

      const renderedHeight = image.naturalHeight * ratio;
      const renderedTop = box.bottom - renderedHeight;
      const mouthFraction = Number(scene.dataset.mouthY ?? 0.265);

      mouthY =
        renderedTop +
        renderedHeight * mouthFraction -
        area.top;

    } else if (placeholder) {
      const box = placeholder.getBoundingClientRect();

      mouthY =
        box.top +
        box.height * .7 -
        area.top;
    }

    const bubbleHeight = bubble.offsetHeight;

    const bubbleTop = Math.max(
      8,
      Math.min(
        Math.max(8, area.height - bubbleHeight - 8),
        mouthY - bubbleHeight * .48
      )
    );

    bubble.style.top = `${bubbleTop}px`;

    const triangleTop = Math.max(
      17,
      Math.min(
        bubbleHeight - 29,
        mouthY - bubbleTop - 10
      )
    );

    bubble.style.setProperty("--tail-y", `${triangleTop}px`);
  }

  window.addEventListener("resize", () => {
    alignDialogue(scenes[sceneIndex]);
  });

  const dots = scenes.map((scene, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "dot";

    dot.setAttribute(
      "aria-label",
      `Ir a ${
        scene.querySelector("h1,h2")?.textContent.trim() ||
        `escena ${index + 1}`
      }`
    );

    dot.addEventListener("click", () => {
      showScene(index);
    });

    dotsContainer.appendChild(dot);

    return dot;
  });

  function schedule(callback, ms) {
    timers.push(window.setTimeout(callback, ms));
  }

  function clearAnimations() {
    version++;

    timers.forEach(timer => {
      clearTimeout(timer);
    });

    timers = [];

    if (typingTimer !== null) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  }

  function updateNavigation() {
    previousButton.disabled = sceneIndex === 0;

    if (sceneIndex === 0) {
      nextLabel.textContent = "Comenzar";
      nextArrow.textContent = "→";

    } else if (sceneIndex === scenes.length - 1) {
      nextLabel.textContent = "Reiniciar";
      nextArrow.textContent = "↻";

    } else {
      nextLabel.textContent = "Siguiente";
      nextArrow.textContent = "→";
    }

    progressFill.style.width =
      `${((sceneIndex + 1) / scenes.length) * 100}%`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-current", index === sceneIndex);

      if (index === sceneIndex) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function reserveSpeechHeight(element, message) {
    element.style.minHeight = "";
    element.textContent = message;

    const measured = element.getBoundingClientRect().height;

    element.style.minHeight =
      `${Math.max(65, Math.ceil(measured))}px`;

    element.textContent = "";
  }

  function typeDialogue(element, bubble, message, animationVersion) {
    if (reducedMotion.matches) {
      element.textContent = message;
      bubble.classList.add("is-complete");
      return;
    }

    const letters = Array.from(message);
    let count = 0;

    typingTimer = window.setInterval(() => {
      if (animationVersion !== version) {
        return;
      }

      count++;
      element.textContent = letters.slice(0, count).join("");

      if (count >= letters.length) {
        clearInterval(typingTimer);
        typingTimer = null;
        bubble.classList.add("is-complete");
      }
    }, 34);
  }

  function playScene() {
    clearAnimations();

    const currentVersion = version;
    const scene = scenes[sceneIndex];
    const character = scene.querySelector(".character-entrance");
    const bubble = scene.querySelector(".speech");
    const speechText = scene.querySelector(".speech-text");
    const reveals = [...scene.querySelectorAll("[data-reveal]")];
    const celebration = scene.querySelector(".celebration");
    const message = scene.dataset.dialogue || "";

    loadMascot(scene);

    scene.classList.add("is-playing");
    character.classList.remove("is-entered");
    bubble.classList.remove("is-visible", "is-complete");

    reveals.forEach(element => {
      element.classList.remove("shown");
    });

    celebration?.classList.remove("is-celebrating");

    reserveSpeechHeight(speechText, message);
    alignDialogue(scene);

    void scene.offsetWidth;

    if (reducedMotion.matches) {
      character.classList.add("is-entered");
      bubble.classList.add("is-visible", "is-complete");
      speechText.textContent = message;

      reveals.forEach(element => {
        element.classList.add("shown");
      });

      alignDialogue(scene);
      return;
    }

    schedule(() => {
      character.classList.add("is-entered");
    }, 120);

    schedule(() => {
      if (currentVersion !== version) {
        return;
      }

      bubble.classList.add("is-visible");

      typeDialogue(
        speechText,
        bubble,
        message,
        currentVersion
      );
    }, 750);

    schedule(() => {
      if (currentVersion === version) {
        alignDialogue(scene);
      }
    }, 1300);

    reveals.forEach((element, index) => {
      schedule(() => {
        if (currentVersion === version) {
          element.classList.add("shown");
        }
      }, 1070 + index * 550);
    });

    if (celebration) {
      schedule(() => {
        celebration.classList.add("is-celebrating");
      }, 1350 + reveals.length * 550);
    }
  }

  function showScene(index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= scenes.length
    ) {
      return;
    }

    clearAnimations();

    const old = scenes[sceneIndex];

    old.classList.remove("is-active", "is-playing");
    old.setAttribute("aria-hidden", "true");

    sceneIndex = index;

    const scene = scenes[sceneIndex];

    scene.classList.add("is-active");
    scene.setAttribute("aria-hidden", "false");
    scene.scrollTop = 0;

    updateNavigation();
    playScene();
  }

  previousButton.addEventListener("click", () => {
    showScene(sceneIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    showScene(
      sceneIndex === scenes.length - 1
        ? 0
        : sceneIndex + 1
    );
  });

  replayButton.addEventListener("click", playScene);

  document.getElementById("homeLink")?.addEventListener("click", event => {
    event.preventDefault();
    showScene(0);
  });

  document.addEventListener("keydown", event => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("button,a,input,textarea,select")
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      showScene(
        sceneIndex === scenes.length - 1
          ? 0
          : sceneIndex + 1
      );
    }

    if (event.key === "ArrowLeft") {
      showScene(sceneIndex - 1);
    }
  });

  viewport.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];

    touchStart = {
      x: touch.screenX,
      y: touch.screenY
    };
  }, { passive: true });

  viewport.addEventListener("touchend", event => {
    if (!touchStart) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.screenX - touchStart.x;
    const dy = touch.screenY - touchStart.y;

    touchStart = null;

    if (
      event.target.closest("button,a") ||
      Math.abs(dx) < 85 ||
      Math.abs(dy) > 65
    ) {
      return;
    }

    if (dx < 0) {
      showScene(
        sceneIndex === scenes.length - 1
          ? 0
          : sceneIndex + 1
      );
    } else {
      showScene(sceneIndex - 1);
    }
  }, { passive: true });

  scenes.forEach((scene, index) => {
    scene.setAttribute("aria-hidden", String(index !== 0));
  });

  document.documentElement.classList.add("js");

  updateNavigation();
  playScene();
});
