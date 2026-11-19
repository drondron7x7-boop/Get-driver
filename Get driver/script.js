"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("readingProgressBar");
    const appButton = document.getElementById("appButton");
    const appStatus = document.getElementById("appStatus");

    const revealSelector = [
        ".vehicle-card",
        ".year-requirement",
        ".info-card",
        ".mascot-slot",
        ".process-list li",
        ".verification-banner",
        ".foreign-card",
        ".commitment-card",
        ".finish-card"
    ].join(", ");

    const revealElements = Array.from(
        document.querySelectorAll(revealSelector)
    );

    let lastScrollY = window.scrollY;
    let scrollDirection = "down";

    /*
     * Registra si el usuario se desplaza hacia arriba o hacia abajo.
     * Se usa para decidir desde qué dirección entrará cada elemento.
     */
    function updateScrollDirection() {
        const currentScrollY = window.scrollY;

        if (currentScrollY < lastScrollY) {
            scrollDirection = "up";
        } else if (currentScrollY > lastScrollY) {
            scrollDirection = "down";
        }

        lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", updateScrollDirection, {
        passive: true
    });

    /*
     * Prepara los elementos para la animación.
     * La reserva de la mascota conserva su movimiento lateral.
     */
    const delayBySection = new WeakMap();

    revealElements.forEach((element) => {
        const section = element.closest("section") || document.body;
        const currentDelay = delayBySection.get(section) || 0;

        element.classList.add("js-reveal");
        element.classList.add(
            scrollDirection === "up" ? "reveal-from-above" : "reveal-from-below"
        );

        element.style.transitionDelay = `${currentDelay}ms`;
        delayBySection.set(section, Math.min(currentDelay + 55, 220));
    });

    /*
     * Al bajar, los elementos llegan desde abajo.
     * Al subir, llegan desde arriba.
     * Al salir de la vista, se preparan para repetir la animación
     * desde el lado correcto la próxima vez que entren.
     */
    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const element = entry.target;

                    if (entry.isIntersecting) {
                        element.classList.remove(
                            "reveal-from-above",
                            "reveal-from-below"
                        );

                        element.classList.add(
                            scrollDirection === "up"
                                ? "reveal-from-above"
                                : "reveal-from-below"
                        );

                        /*
                         * Dos requestAnimationFrame garantizan que el navegador
                         * aplique primero el estado inicial y luego la transición.
                         */
                        element.classList.remove("is-visible");

                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                element.classList.add("is-visible");
                            });
                        });
                    } else {
                        element.classList.remove("is-visible");
                        element.classList.remove(
                            "reveal-from-above",
                            "reveal-from-below"
                        );

                        /*
                         * Si se baja, el elemento que sale queda arriba,
                         * preparado para entrar desde arriba cuando se vuelva.
                         * Si se sube, queda abajo y entra desde abajo al regresar.
                         */
                        element.classList.add(
                            scrollDirection === "down"
                                ? "reveal-from-above"
                                : "reveal-from-below"
                        );
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -5% 0px"
            }
        );

        revealElements.forEach((element) => {
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });
    }

    // Actualiza el indicador de progreso de lectura superior.
    function updateReadingProgress() {
        if (!progressBar) {
            return;
        }

        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress = scrollableHeight > 0
            ? (window.scrollY / scrollableHeight) * 100
            : 0;

        progressBar.style.width =
            `${Math.min(Math.max(progress, 0), 100)}%`;
    }

    window.addEventListener("scroll", updateReadingProgress, {
        passive: true
    });

    window.addEventListener("resize", updateReadingProgress);
    updateReadingProgress();

    // El botón Comenzar desplaza hacia la sección de requisitos del vehículo.
    document.querySelectorAll("[data-start-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
            const vehicleSection = document.querySelector("#vehiculo");

            if (!vehicleSection) {
                return;
            }

            event.preventDefault();

            vehicleSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    // No se inventa el enlace de descarga de la aplicación.
    if (appButton && appStatus) {
        appButton.addEventListener("click", () => {
            appStatus.textContent =
                "El enlace oficial aún no está disponible. Podrás abrir la aplicación cuando Get Driver lo proporcione.";
            appStatus.classList.add("app-status-visible");
        });
    }
});
