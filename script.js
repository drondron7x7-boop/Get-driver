"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".scene")];
  const template = document.getElementById("guideTemplate");
  const previous = document.getElementById("prevButton");
  const next = document.getElementById("nextButton");
  const nextLabel = document.getElementById("nextLabel");
  const nextArrow = document.getElementById("nextArrow");
  const replay = document.getElementById("replayButton");
  const dotsHolder = document.getElementById("sceneDots");
  const progressFill = document.getElementById("progressFill");
  const viewport = document.querySelector(".viewport");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (
    !scenes.length ||
    !template ||
    !previous ||
    !next ||
    !nextLabel ||
    !nextArrow ||
    !replay ||
    !dotsHolder ||
    !progressFill ||
    !viewport
  ) {
    console.error("Get Driver: falta un elemento necesario en index.html.");
    return;
  }

  let current = 0;
  let animationVersion = 0;
  let timeouts = [];
  let typingInterval = null;
  let touchStart = null;

  scenes.forEach((scene) => {
    const guide = template.content.firstElementChild.cloneNode(true);

    const image = guide.querySelector(".guide-image");
    const character = guide.querySelector(".guide-character");

    const title = scene.querySelector("h1, h2")?.textContent.trim() || "Get Driver";
    image.alt = `Mascota de Get Driver: ${title}`;

    image.addEventListener("load", () => {
      character.classList.toggle("has-image", image.naturalWidth > 0);
    });

    image.addEventListener("error", () => {
      character.classList.remove("has-image");
    });

    scene.querySelector(".scene-shell").prepend(guide);
  });

  function loadMascot(scene) {
    const image = scene.querySelector(".guide-image");

    if (!image || image.dataset.loaded) {
      return;
    }

    image.dataset.loaded = "requested";
    image.src = scene.dataset.gif || "";

    if (image.complete && image.naturalWidth) {
      image.closest(".guide-character").classList.add("has-image");
    }
  }

  const brandImage = document.getElementById("brandImage");
  const brandSymbol = document.getElementById("brandSymbol");

  if (brandImage && brandSymbol) {
    const refreshBrand = () => {
      brandSymbol.classList.toggle(
        "has-image",
        brandImage.complete && brandImage.naturalWidth > 0
      );
    };

    brandImage.addEventListener("load", refreshBrand);
    brandImage.addEventListener("error", refreshBrand);

    refreshBrand();
  }

  const dots = scenes.map((scene, index) => {
    const button = document.createElement("button");

    button.className = "scene-dot";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Ir a ${scene.querySelector("h1, h2").textContent.trim()}`
    );

    button.addEventListener("click", () => {
      showScene(index);
    });

    dotsHolder.appendChild(button);
    return button;
  });

  function schedule(callback, delay) {
    const id = window.setTimeout(callback, reducedMotion.matches ? 0 : delay);
    timeouts.push(id);
  }

  function cancelAnimations() {
    animationVersion++;

    timeouts.forEach((id) => {
      window.clearTimeout(id);
    });

    timeouts = [];

    if (typingInterval !== null) {
      window.clearInterval(typingInterval);
      typingInterval = null;
    }

    scenes.forEach((scene) => {
      scene.querySelector(".speech")?.classList.remove("is-typing");
    });
  }

  function updateControls() {
    previous.disabled = current === 0;

    nextLabel.textContent =
      current === 0
        ? "Comenzar"
        : current === scenes.length - 1
          ? "Volver al inicio"
          : "Siguiente";

    nextArrow.textContent = current === scenes.length - 1 ? "↻" : "→";

    progressFill.style.width = `${((current + 1) / scenes.length) * 100}%`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-current", index === current);

      if (index === current) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function writeDialogue(textElement, bubble, fullText, version) {
    if (reducedMotion.matches) {
      textElement.textContent = fullText;
      bubble.classList.remove("is-typing");
      return;
    }

    const characters = Array.from(fullText);
    let position = 0;

    typingInterval = window.setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      position = Math.min(position + 1, characters.length);

      textElement.textContent = characters.slice(0, position).join("");

      if (position >= characters.length) {
        window.clearInterval(typingInterval);
        typingInterval = null;
        bubble.classList.remove("is-typing");
      }
    }, 33);
  }

  function playScene() {
    cancelAnimations();

    const version = animationVersion;
    const scene = scenes[current];

    const character = scene.querySelector(".guide-character");
    const bubble = scene.querySelector(".speech");
    const speechText = scene.querySelector(".speech-text");

    const elements = [...scene.querySelectorAll("[data-reveal]")];
    const dialogue = scene.dataset.dialogue || "";

    loadMascot(scene);

    scene.classList.add("is-playing");

    character.classList.remove("is-entered");
    bubble.classList.remove("is-visible", "is-typing");
    speechText.textContent = "";

    elements.forEach((element) => {
      element.classList.remove("shown");
    });

    void scene.offsetWidth;

    if (reducedMotion.matches) {
      character.classList.add("is-entered");
      bubble.classList.add("is-visible");
      speechText.textContent = dialogue;

      elements.forEach((element) => {
        element.classList.add("shown");
      });

      return;
    }

    schedule(() => {
      if (version === animationVersion) {
        character.classList.add("is-entered");
      }
    }, 130);

    schedule(() => {
      if (version !== animationVersion) {
        return;
      }

      bubble.classList.add("is-visible", "is-typing");
      writeDialogue(speechText, bubble, dialogue, version);
    }, 790);

    elements.forEach((element, index) => {
      schedule(() => {
        if (version === animationVersion) {
          element.classList.add("shown");
        }
      }, 1190 + index * 790);
    });
  }

  function showScene(index) {
    if (!Number.isInteger(index) || index < 0 || index >= scenes.length) {
      return;
    }

    cancelAnimations();

    scenes[current].classList.remove("is-active", "is-playing");
    scenes[current].setAttribute("aria-hidden", "true");

    current = index;

    const scene = scenes[current];

    scene.classList.add("is-active");
    scene.setAttribute("aria-hidden", "false");
    scene.scrollTop = 0;

    updateControls();
    playScene();
  }

  previous.addEventListener("click", () => {
    showScene(current - 1);
  });

  next.addEventListener("click", () => {
    showScene(current === scenes.length - 1 ? 0 : current + 1);
  });

  replay.addEventListener("click", () => {
    playScene();
  });

  document.getElementById("goHome")?.addEventListener("click", (event) => {
    event.preventDefault();
    showScene(0);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("button, a, input, textarea, select")
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      showScene(current === scenes.length - 1 ? 0 : current + 1);
    }

    if (event.key === "ArrowLeft") {
      showScene(current - 1);
    }
  });

  viewport.addEventListener(
    "touchstart",
    (event) => {
      touchStart = {
        x: event.changedTouches[0].screenX,
        y: event.changedTouches[0].screenY
      };
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart || event.target.closest("button, a")) {
        return;
      }

      const dx = event.changedTouches[0].screenX - touchStart.x;
      const dy = event.changedTouches[0].screenY - touchStart.y;

      touchStart = null;

      if (Math.abs(dx) < 90 || Math.abs(dy) > 65) {
        return;
      }

      if (dx < 0) {
        showScene(current === scenes.length - 1 ? 0 : current + 1);
      } else {
        showScene(current - 1);
      }
    },
    { passive: true }
  );

  scenes.forEach((scene, index) => {
    scene.setAttribute("aria-hidden", String(index !== 0));
  });

  document.documentElement.classList.add("js");

  updateControls();
  playScene();
});
