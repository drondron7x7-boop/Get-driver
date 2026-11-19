"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("readingProgressBar");
    const appButton = document.getElementById("appButton");
    const appStatus = document.getElementById("appStatus");
    const revealElements = document.querySelectorAll(
        ".vehicle-card, .year-requirement, .info-card, .mascot-slot, " +
        ".process-list li, .verification-banner, .foreign-card, " +
        ".commitment-card, .finish-card"
    );

    // Añade la animación de entrada a los bloques al aparecer en pantalla.
    revealElements.forEach((element) => {
        element.classList.add("js-reveal");
    });

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12
        });

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    // Actualiza la barra superior según cuánto ha avanzado el usuario en la página.
    function updateReadingProgress() {
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress = scrollableHeight > 0
            ? (window.scrollY / scrollableHeight) * 100
            : 0;

        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);
    updateReadingProgress();

    // Enlace de bienvenida: desplaza al inicio de los requisitos.
    document.querySelectorAll("[data-start-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            document.querySelector("#vehiculo").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    // No hay URL oficial todavía: informa al usuario sin inventar un enlace.
    appButton.addEventListener("click", () => {
        appStatus.textContent =
            "El enlace oficial aún no está disponible. Podrás abrir la aplicación cuando Get Driver lo proporcione.";
        appStatus.classList.add("app-status-visible");
    });
});