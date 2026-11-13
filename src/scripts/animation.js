const revealStyle = document.createElement("style");
revealStyle.textContent = `
  .reveal-item {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .reveal-item.is-visible {
    opacity: 1;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal-item {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
`;
document.head.appendChild(revealStyle);

function applyRevealAnimations() {
  const revealItems = document.querySelectorAll(
    ".reveal, .item-card, #hero, #about, #projects, #services, #contact"
  );

  if (!revealItems.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => {
      item.classList.add("reveal-item");
      observer.observe(item);
      // REMOVED the immediate is-visible add so the animation actually plays
    });

    return;
  }

  revealItems.forEach((item) => {
    item.classList.add("reveal-item", "is-visible");
  });
}

function setupThemeToggle() {
  const toggleButton = document.querySelector("#toggledark");
  const root = document.documentElement;

  if (!toggleButton || toggleButton.dataset.bound === "true") return;
  toggleButton.dataset.bound = "true";

  const syncThemeState = () => {
    const isDark = root.classList.contains("dark");
    toggleButton.setAttribute("aria-pressed", String(isDark));
  };

  syncThemeState();

  toggleButton.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    toggleButton.setAttribute("aria-pressed", String(isDark));

    if (window.gsap) {
      gsap.fromTo(
        toggleButton,
        { rotation: 0 },
        { rotation: 360, duration: 0.5, ease: "power2.out", clearProps: "rotation" }
      );
    }
  });
}

function setupReplayIntro() {
  const replayButton = document.querySelector("#replayBtn");
  const revealItems = document.querySelectorAll(
    ".reveal-item, .reveal, .item-card, #hero, #about, #projects, #services, #contact"
  );

  if (!replayButton || replayButton.dataset.bound === "true") return;
  replayButton.dataset.bound = "true";

  replayButton.addEventListener("click", () => {
    revealItems.forEach((item) => {
      item.classList.remove("is-visible");
      void item.offsetWidth;
      item.classList.add("is-visible");
    });

    if (window.__marjorieIntroTimeline) {
      window.__marjorieIntroTimeline.restart();
    }

    if (window.gsap) {
      gsap.fromTo(
        replayButton,
        { rotation: 0 },
        { rotation: -360, duration: 0.5, ease: "power2.out", clearProps: "rotation" }
      );
    }

    // NEW: Trigger Scramble on Replay
    if (window.__scrambleElements) {
      window.__scrambleElements.forEach((element) => {
        window.__scrambleText(element);
      });
    }
  });
}

function setupContactForm() {
  const contactForm = document.querySelector("#contactForm");

  if (!contactForm || contactForm.dataset.bound === "true") return;
  contactForm.dataset.bound = "true";

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector("button[type='submit']");
    if (!submitButton) return;

    const originalText = submitButton.textContent;
    submitButton.textContent = "Sent! ✨";
    submitButton.disabled = true;

    window.setTimeout(() => {
      contactForm.reset();
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }, 900);
  });
}

function setupProgressBar() {
  const progressBar = document.querySelector("#progressBar");
  if (!progressBar || !window.gsap || !window.ScrollTrigger) return;

  gsap.fromTo(
    progressBar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    }
  );
}

// NEW: Setup Text Scramble
function setupTextScramble() {
  if (!window.gsap || !window.ScrollTrigger) return;

  const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  
  const scrambleElements = gsap.utils.toArray([
    "#hero h1",
    "#hero p",
    ".section-title",
    ".item-card h3",
    ".item-card p",
    ".about-content p"
  ].join(","));

  // Save original text to dataset
  scrambleElements.forEach((element) => {
    element.dataset.scrambleOriginal = element.textContent;
  });

  function scrambleText(element) {
    if (!element) return;
    if (element._scrambleTween) {
      element._scrambleTween.kill();
    }
    
    const original = element.dataset.scrambleOriginal;
    if (original === undefined) return;
    
    const characters = Array.from(original);
    const progress = { value: 0 };
    
    element._scrambleTween = gsap.to(progress, {
      value: 1,
      duration: 1.15,
      ease: "none",
      onUpdate: () => {
        const revealCount = Math.floor(progress.value * characters.length);
        element.textContent = characters.map((char, index) => {
          if (/\s/.test(char)) return char;
          if (index < revealCount) return char;
          return scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
        }).join("");
      },
      onComplete: () => {
        element.textContent = original;
        element._scrambleTween = null;
      }
    });
  }

  // Expose these globally so the Replay button can use them
  window.__scrambleElements = scrambleElements;
  window.__scrambleText = scrambleText;

  // Trigger scramble when scrolling into view
  scrambleElements.forEach((element) => {
    ScrollTrigger.create({
      trigger: element,
      start: "top 85%", 
      onEnter: () => scrambleText(element),
      once: true 
    });
  });
}

function setupIntroTimeline() {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const introTimeline = gsap.timeline({ defaults: { duration: 0.7, ease: "power2.out" } });

  introTimeline
    .from("header nav a", { y: -30, opacity: 0, stagger: 0.08 })
    .from("#hero h1", { x: -50, opacity: 0, duration: 0.8 }, "-=0.3")
    .from("#hero p, #hero a", { y: 30, opacity: 0, stagger: 0.08 }, "-=0.5");

  window.__marjorieIntroTimeline = introTimeline;

  ["#about", "#projects", "#services", "#contact"].forEach((selector) => {
    const target = document.querySelector(selector);
    if (!target) return;

    target.style.opacity = "1";
    target.style.transform = "none";
  });
}

function initAnimation() {
  if (window.__marjorieAnimationInitialized) return;
  window.__marjorieAnimationInitialized = true;

  applyRevealAnimations();
  setupThemeToggle();
  setupReplayIntro();
  setupContactForm();
  setupProgressBar();
  setupTextScramble(); // NEW: Initialize Scramble
  setupIntroTimeline();
}

function loadGsap() {
  if (window.__marjorieAnimationInitialized) return;

  if (window.gsap && window.ScrollTrigger) {
    initAnimation();
    return;
  }

  const gsapScript = document.createElement("script");
  gsapScript.src = "https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js";
  gsapScript.onload = () => {
    const scrollTriggerScript = document.createElement("script");
    scrollTriggerScript.src = "https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js";
    scrollTriggerScript.onload = () => {
      initAnimation();
    };
    document.head.appendChild(scrollTriggerScript);
  };
  document.head.appendChild(gsapScript);
}

document.addEventListener("DOMContentLoaded", loadGsap);

if (document.readyState !== "loading") {
  loadGsap();
}