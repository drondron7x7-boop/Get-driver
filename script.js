
"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // =====================================================
  // ELEMENTOS PRINCIPALES
  // =====================================================

  const scenes = [...document.querySelectorAll(".scene")];

  const template =
    document.getElementById("mascotTemplate");

  const previousButton =
    document.getElementById("prevButton");

  const nextButton =
    document.getElementById("nextButton");

  const nextLabel =
    document.getElementById("nextLabel");

  const nextArrow =
    document.getElementById("nextArrow");

  const replayButton =
    document.getElementById("replayButton");

  const dotsContainer =
    document.getElementById("sceneDots");

  const progressFill =
    document.getElementById("progressFill");

  const viewport =
    document.getElementById("viewport");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

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
    console.error(
      "Get Driver: faltan elementos del HTML para iniciar."
    );
    return;
  }

  let sceneIndex = 0;
  let animationId = 0;
  let pendingTimers = [];
  let typeTimer = null;
  let touchStart = null;

  // =====================================================
  // AGREGAR ALEX A LAS NUEVE ESCENAS
  // =====================================================

  scenes.forEach((scene) => {

    const mascot =
      template.content.firstElementChild.cloneNode(true);

    const image =
      mascot.querySelector(".mascot-image");

    const pose =
      mascot.querySelector(".mascot-pose");

    const title =
      scene.querySelector("h1,h2")?.textContent.trim() ||
      "Get Driver";

    image.alt =
      `Mascota de Get Driver presentando: ${title}`;

    image.addEventListener("load", () => {

      pose.classList.toggle(
        "has-image",
        image.naturalWidth > 0
      );

      if (scene.classList.contains("is-active")) {
        alignDialogue(scene);
      }

    });

    image.addEventListener("error", () => {
      pose.classList.remove("has-image");
    });

    scene.querySelector(".scene-shell").prepend(mascot);

  });

  // =====================================================
  // CARGAR LA MASCOTA
  // =====================================================

  function loadMascot(scene) {

    const image =
      scene.querySelector(".mascot-image");

    if (!image || image.dataset.requested) {
      return;
    }

    image.dataset.requested = "true";

    image.src = scene.dataset.gif || "";

    if (image.complete && image.naturalWidth > 0) {

      image.closest(".mascot-pose")
        .classList.add("has-image");

    }

  }

  // =====================================================
  // POSICIONAR BURBUJA Y PUNTA DEL DIÁLOGO
  // =====================================================

  function alignDialogue(scene) {

    if (!scene.classList.contains("is-active")) {
      return;
    }

    const guide =
      scene.querySelector(".guide");

    const bubble =
      guide?.querySelector(".speech");

    const image =
      guide?.querySelector(".mascot-image");

    const placeholder =
      guide?.querySelector(".placeholder-head");

    const pointer =
      guide?.querySelector(".dialogue-pointer");

    const tail =
      guide?.querySelector(".pointer-tail");

    if (
      !guide ||
      !bubble ||
      !pointer ||
      !tail
    ) {
      return;
    }

    const guideBox =
      guide.getBoundingClientRect();

    const imageLoaded =
      image && image.naturalWidth > 0;

    let mouthX;
    let mouthY;

    if (imageLoaded) {

      const frame =
        image.getBoundingClientRect();

      const ratio = Math.min(
        frame.width / image.naturalWidth,
        frame.height / image.naturalHeight
      );

      const actualW =
        image.naturalWidth * ratio;

      const actualH =
        image.naturalHeight * ratio;

      const left =
        frame.left + (frame.width - actualW) / 2;

      const top =
        frame.bottom - actualH;

      // Punto aproximado de diálogo del GIF actual.
      // Se podrá modificar cuando haya otras poses.

      const mx = Number(
        scene.dataset.mouthX || 0.59
      );

      const my = Number(
        scene.dataset.mouthY || 0.265
      );

      mouthX =
        left + actualW * mx - guideBox.left;

      mouthY =
        top + actualH * my - guideBox.top;

    } else if (placeholder) {

      const box =
        placeholder.getBoundingClientRect();

      mouthX =
        box.left + box.width / 2 - guideBox.left;

      mouthY =
        box.top + box.height * .7 - guideBox.top;

    } else {
      return;
    }

    // Burbuja dentro del área disponible.

    const bubbleHeight =
      bubble.offsetHeight;

    const upperLimit = Math.max(
      6,
      guide.clientHeight - bubbleHeight - 8
    );

    const preferredTop =
      mouthY - bubbleHeight * .53;

    const bubbleTop = Math.max(
      6,
      Math.min(upperLimit, preferredTop)
    );

    bubble.style.top = `${bubbleTop}px`;

    // Punta corta hacia Alex.

    const bubbleBox =
      bubble.getBoundingClientRect();

    const rightSide =
      scene.dataset.side === "right";

    const fromX =
      (
        rightSide
          ? bubbleBox.right
          : bubbleBox.left
      ) - guideBox.left;

    const fromY =
      bubbleBox.top -
      guideBox.top +
      bubbleBox.height * .52;

    const dx = mouthX - fromX;
    const dy = mouthY - fromY;

    const distance = Math.max(
      1,
      Math.hypot(dx,dy)
    );

    const pointerLength = Math.min(
      29,
      distance * .45
    );

    const toX =
      fromX + (dx / distance) * pointerLength;

    const toY =
      fromY + (dy / distance) * pointerLength;

    const controlX =
      (fromX + toX) / 2;

    const controlY =
      (fromY + toY) / 2;

    const width =
      Math.max(1,guideBox.width);

    const height =
      Math.max(1,guideBox.height);

    pointer.setAttribute(
      "viewBox",
      `0 0 ${width} ${height}`
    );

    const path = [
      `M ${fromX} ${fromY - 9}`,
      `Q ${controlX} ${controlY - 6} ${toX} ${toY}`,
      `Q ${controlX} ${controlY + 6} ${fromX} ${fromY + 9}`,
      "Z"
    ].join(" ");

    tail.setAttribute("d", path);

  }

  window.addEventListener("resize", () => {
    alignDialogue(scenes[sceneIndex]);
  });

  // =====================================================
  // PUNTOS PARA CAMBIAR DE ESCENA
  // =====================================================

  const dots = scenes.map((scene,index) => {

    const dot =
      document.createElement("button");

    dot.type = "button";
    dot.className = "dot";

    const title =
      scene.querySelector("h1,h2").textContent.trim();

    dot.setAttribute(
      "aria-label",
      `Ir a ${title}`
    );

    dot.addEventListener("click", () => {
      showScene(index);
    });

    dotsContainer.append(dot);

    return dot;

  });

  // =====================================================
  // CONTROL DE ANIMACIONES
  // =====================================================

  function schedule(callback,delay) {

    const timer =
      window.setTimeout(callback,delay);

    pendingTimers.push(timer);

  }

  function cancelAnimations() {

    animationId++;

    pendingTimers.forEach((timer) => {
      window.clearTimeout(timer);
    });

    pendingTimers = [];

    if (typeTimer !== null) {

      window.clearInterval(typeTimer);
      typeTimer = null;

    }

  }

  // =====================================================
  // ACTUALIZAR BOTONES Y PROGRESO
  // =====================================================

  function updateNavigation() {

    previousButton.disabled =
      sceneIndex === 0;

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

    const progress =
      ((sceneIndex + 1) / scenes.length) * 100;

    progressFill.style.width =
      `${progress}%`;

    dots.forEach((dot,index) => {

      const active = index === sceneIndex;

      dot.classList.toggle(
        "is-current",
        active
      );

      if (active) {

        dot.setAttribute(
          "aria-current",
          "step"
        );

      } else {

        dot.removeAttribute("aria-current");

      }

    });

  }

  // =====================================================
  // PREPARAR BURBUJA SIN CAMBIOS DE TAMAÑO
  // =====================================================

  function reserveSpeechHeight(textElement,message) {

    textElement.style.minHeight = "";

    textElement.textContent = message;

    const fullHeight =
      textElement.getBoundingClientRect().height;

    textElement.style.minHeight =
      `${Math.max(65,Math.ceil(fullHeight))}px`;

    textElement.textContent = "";

  }

  // =====================================================
  // ESCRIBIR DIÁLOGO PROGRESIVAMENTE
  // =====================================================

  function typeDialogue(
    textElement,
    bubble,
    message,
    currentAnimation
  ) {

    if (prefersReducedMotion.matches) {

      textElement.textContent = message;

      bubble.classList.add("is-complete");

      return;

    }

    const letters =
      Array.from(message);

    let position = 0;

    typeTimer = window.setInterval(() => {

      if (currentAnimation !== animationId) {
        return;
      }

      position++;

      textElement.textContent =
        letters.slice(0,position).join("");

      if (position >= letters.length) {

        window.clearInterval(typeTimer);

        typeTimer = null;

        bubble.classList.add("is-complete");

      }

    },34);

  }

  // =====================================================
  // REPRODUCIR ESCENA
  // =====================================================

  function playScene() {

    cancelAnimations();

    const currentAnimation = animationId;

    const scene =
      scenes[sceneIndex];

    const character =
      scene.querySelector(".character-entrance");

    const speech =
      scene.querySelector(".speech");

    const guide =
      scene.querySelector(".guide");

    const speechText =
      scene.querySelector(".speech-text");

    const reveals = [
      ...scene.querySelectorAll("[data-reveal]")
    ];

    const message =
      scene.dataset.dialogue || "";

    const celebration =
      scene.querySelector(".celebration");

    loadMascot(scene);

    scene.classList.add("is-playing");

    character.classList.remove("is-entered");

    speech.classList.remove(
      "is-visible",
      "is-complete"
    );

    guide.classList.remove("is-speaking");

    reveals.forEach((item) => {
      item.classList.remove("shown");
    });

    celebration?.classList.remove(
      "is-celebrating"
    );

    reserveSpeechHeight(
      speechText,
      message
    );

    alignDialogue(scene);

    // Permite volver a reproducir las animaciones CSS.
    void scene.offsetWidth;

    // Modo de movimiento reducido.

    if (prefersReducedMotion.matches) {

      character.classList.add("is-entered");

      speech.classList.add(
        "is-visible",
        "is-complete"
      );

      guide.classList.add("is-speaking");

      speechText.textContent = message;

      reveals.forEach((item) => {
        item.classList.add("shown");
      });

      return;

    }

    // Fase 1: entrada de Alex.

    schedule(() => {

      if (currentAnimation === animationId) {
        character.classList.add("is-entered");
      }

      schedule(() => {

        if (currentAnimation === animationId) {
          alignDialogue(scene);
        }

      },1000);

    },120);

    // Fase 2: aparece el diálogo.

    schedule(() => {

      if (currentAnimation !== animationId) {
        return;
      }

      speech.classList.add("is-visible");

      guide.classList.add("is-speaking");

      typeDialogue(
        speechText,
        speech,
        message,
        currentAnimation
      );

    },750);

    // Ajustar la punta de la burbuja.

    schedule(() => {

      if (currentAnimation === animationId) {
        alignDialogue(scene);
      }

    },1540);

    // Fase 3: elementos visuales progresivos.

    reveals.forEach((item,index) => {

      const delay =
        1070 + index * 550;

      schedule(() => {

        if (currentAnimation === animationId) {
          item.classList.add("shown");
        }

      },delay);

    });

    // Fase 4: pequeña celebración del cierre.

    if (celebration) {

      schedule(() => {

        if (currentAnimation === animationId) {
          celebration.classList.add(
            "is-celebrating"
          );
        }

      },1350 + reveals.length * 550);

    }

  }

  // =====================================================
  // CAMBIAR ENTRE ESCENAS
  // =====================================================

  function showScene(index) {

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= scenes.length
    ) {
      return;
    }

    cancelAnimations();

    const previousScene =
      scenes[sceneIndex];

    previousScene.classList.remove(
      "is-active",
      "is-playing"
    );

    previousScene.setAttribute(
      "aria-hidden",
      "true"
    );

    sceneIndex = index;

    const scene =
      scenes[sceneIndex];

    scene.classList.add("is-active");

    scene.setAttribute(
      "aria-hidden",
      "false"
    );

    scene.scrollTop = 0;

    updateNavigation();

    playScene();

  }

  // =====================================================
  // CONTROLES INFERIORES
  // =====================================================

  previousButton.addEventListener("click", () => {
    showScene(sceneIndex - 1);
  });

  nextButton.addEventListener("click", () => {

    if (sceneIndex === scenes.length - 1) {
      showScene(0);
    } else {
      showScene(sceneIndex + 1);
    }

  });

  replayButton.addEventListener("click", () => {
    playScene();
  });

  document.getElementById("homeLink")
    ?.addEventListener("click",(event) => {

      event.preventDefault();

      showScene(0);

    });

  // =====================================================
  // TECLADO: FLECHAS IZQUIERDA Y DERECHA
  // =====================================================

  document.addEventListener("keydown",(event) => {

    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest(
        "button,a,input,textarea,select"
      )
    ) {
      return;
    }

    if (event.key === "ArrowRight") {

      if (sceneIndex === scenes.length - 1) {
        showScene(0);
      } else {
        showScene(sceneIndex + 1);
      }

    }

    if (event.key === "ArrowLeft") {
      showScene(sceneIndex - 1);
    }

  });

  // =====================================================
  // DESLIZAMIENTO EN CELULARES
  // =====================================================

  viewport.addEventListener(
    "touchstart",
    (event) => {

      const touch =
        event.changedTouches[0];

      touchStart = {
        x: touch.screenX,
        y: touch.screenY
      };

    },
    {passive:true}
  );

  viewport.addEventListener(
    "touchend",
    (event) => {

      if (!touchStart) {
        return;
      }

      if (event.target.closest("button,a")) {
        touchStart = null;
        return;
      }

      const touch =
        event.changedTouches[0];

      const dx =
        touch.screenX - touchStart.x;

      const dy =
        touch.screenY - touchStart.y;

      touchStart = null;

      if (
        Math.abs(dx) < 85 ||
        Math.abs(dy) > 65
      ) {
        return;
      }

      if (dx < 0) {

        if (sceneIndex === scenes.length - 1) {
          showScene(0);
        } else {
          showScene(sceneIndex + 1);
        }

      } else {
        showScene(sceneIndex - 1);
      }

    },
    {passive:true}
  );

  // =====================================================
  // INICIAR PRESENTACIÓN
  // =====================================================

  scenes.forEach((scene,index) => {

    scene.setAttribute(
      "aria-hidden",
      String(index !== 0)
    );

  });

  document.documentElement.classList.add("js");

  updateNavigation();

  playScene();

});
