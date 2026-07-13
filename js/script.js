/* =========================================================
   TRASTES — LUTHERÍA DE AUTOR
   Script principal
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------
     1. LENIS — Scroll suave
  ----------------------------------------------------- */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sincroniza Lenis con ScrollTrigger de GSAP
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Links internos con scroll suave — se registra SIEMPRE (no solo si
  // Lenis cargó), para que el offset del navbar se respete incluso si
  // la librería no llegó a cargar (CDN lento/bloqueado, etc.). Si Lenis
  // está disponible se usa para la animación; si no, cae a un scroll
  // nativo con el mismo offset, para que ninguna sección quede tapada.
  const navbarEl = document.querySelector('.navbar');
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        // El offset se calcula en vivo a partir del alto real del
        // navbar fijo (cambia entre desktop/tablet/mobile), para que
        // cada sección quede siempre perfectamente alineada debajo
        // del menú, sin quedar cortada ni con espacio de más.
        const navH = navbarEl ? navbarEl.offsetHeight : 80;
        if (lenis) {
          lenis.scrollTo(target, { offset: -navH });
        } else {
          const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        closeMobileMenu();
      }
    });
  });

  /* -----------------------------------------------------
     2. CURSOR PREMIUM
  ----------------------------------------------------- */
  const cursor = document.getElementById('cursor');
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (cursor && !isTouch) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      // seguimiento suave (lerp)
      cursorX += (mouseX - cursorX) * 0.16;
      cursorY += (mouseY - cursorY) * 0.16;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const hoverTargets = 'a, button, input, textarea, .btn';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove('is-hover');
    });
    document.addEventListener('mousedown', () => cursor.classList.add('is-click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('is-click'));
  }

  /* -----------------------------------------------------
     2b. SPOTLIGHT VERDE — sigue al mouse sobre el Hero
  ----------------------------------------------------- */
  const heroSection = document.querySelector('.hero');
  const heroSpotlight = document.getElementById('heroSpotlight');

  if (heroSection && heroSpotlight && !isTouch) {
    let spotX = 50, spotY = 50;
    let targetX = 50, targetY = 50;

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
    });

    function animateSpotlight() {
      spotX += (targetX - spotX) * 0.15;
      spotY += (targetY - spotY) * 0.15;
      heroSpotlight.style.setProperty('--spot-x', `${spotX}%`);
      heroSpotlight.style.setProperty('--spot-y', `${spotY}%`);
      requestAnimationFrame(animateSpotlight);
    }
    animateSpotlight();
  }

  /* -----------------------------------------------------
     3. NAVBAR — Transparente / con fondo al hacer scroll
  ----------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  function updateNavbar() {
    if (window.scrollY > 40) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }
  updateNavbar();
  window.addEventListener('scroll', updateNavbar, { passive: true });

  /* -----------------------------------------------------
     3b. SCROLLSPY — Resalta la sección activa en el menú
  ----------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('.navbar__nav a, .mobile-menu a'));
  const sections = navLinks
    .filter((link) => link.getAttribute('href').startsWith('#'))
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const uniqueSections = Array.from(new Set(sections));

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  }

  if (uniqueSections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        // Elige la sección más visible en este momento
        let best = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry;
            }
          }
        });
        if (best) setActiveLink(best.target.id);
      },
      { rootMargin: `-${86 + 40}px 0px -55% 0px`, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    uniqueSections.forEach((section) => spyObserver.observe(section));

    // Marca la sección activa apenas se hace click, para feedback instantáneo
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const id = link.getAttribute('href').replace('#', '');
        setActiveLink(id);
      });
    });
  }

  /* -----------------------------------------------------
     4. MENÚ MOBILE
  ----------------------------------------------------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* -----------------------------------------------------
     5. INTERACCIÓN DEL TÍTULO DEL HERO
     Al tocar "TU SONIDO MERECE UNA HISTORIA PROPIA":
     reproduce el sonido de guitarra, el título se ilumina
     y se disparan destellos alrededor.
  ----------------------------------------------------- */
  const heroTitleGroup = document.getElementById('heroTitleGroup');
  const heroSparks = document.getElementById('heroSparks');
  const heroWaves = document.getElementById('heroWaves');
  const guitarSound = document.getElementById('guitarSound');

  function spawnWaves(container) {
    if (!container) return;
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const wave = document.createElement('span');
      wave.className = 'wave';
      container.appendChild(wave);

      const delay = i * 0.15;
      const targetScale = 6 + i * 1.5;

      if (window.gsap) {
        gsap.fromTo(wave,
          { opacity: 0.8, scale: 0.3 },
          {
            opacity: 0, scale: targetScale,
            duration: 1.1,
            delay,
            ease: 'power2.out',
            onComplete: () => wave.remove()
          }
        );
      } else {
        wave.style.transition = `transform 1.1s ease-out ${delay}s, opacity 1.1s ease-out ${delay}s`;
        requestAnimationFrame(() => {
          wave.style.transform = `scale(${targetScale})`;
          wave.style.opacity = '0';
        });
        setTimeout(() => wave.remove(), (1.1 + delay) * 1000 + 80);
      }
    }
  }

  function spawnSparks(container) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const count = 18;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      const startX = Math.random() * rect.width;
      const startY = Math.random() * rect.height;
      spark.style.left = `${startX}px`;
      spark.style.top = `${startY}px`;
      container.appendChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 70;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const scale = 0.4 + Math.random() * 1.2;
      const duration = 500 + Math.random() * 500;

      if (window.gsap) {
        gsap.fromTo(spark,
          { opacity: 1, scale: 0.4, x: 0, y: 0 },
          {
            opacity: 0, scale, x: dx, y: dy,
            duration: duration / 1000,
            ease: 'power2.out',
            onComplete: () => spark.remove()
          }
        );
      } else {
        spark.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        requestAnimationFrame(() => {
          spark.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
          spark.style.opacity = '0';
        });
        setTimeout(() => spark.remove(), duration + 50);
      }
    }
  }

  if (heroTitleGroup) {
    heroTitleGroup.addEventListener('click', () => {
      // Sonido de guitarra, una vez por click
      if (guitarSound) {
        guitarSound.muted = false;
        guitarSound.volume = 1;
        guitarSound.currentTime = 0;
        guitarSound.play().catch((err) => {
          console.warn('No se pudo reproducir el sonido de guitarra:', err);
        });
      }

      // El título se ilumina brevemente
      heroTitleGroup.classList.add('is-lit');
      setTimeout(() => heroTitleGroup.classList.remove('is-lit'), 900);

      // Destellos y ondas sonoras alrededor del título
      spawnSparks(heroSparks);
      spawnWaves(heroWaves);
    });
  }

  /* -----------------------------------------------------
     6. VIDEO — autoplay en loop, silenciado por defecto,
        con botón de mute/unmute independiente
  ----------------------------------------------------- */
  const videoSection = document.querySelector('.video');
  const videoPlayer = document.getElementById('videoPlayer');

  if (videoSection && videoPlayer) {
    videoPlayer.addEventListener('play', () => {
      videoSection.classList.add('is-playing');
    });
    // Intento explícito por si el navegador bloqueó el autoplay del atributo
    const tryPlay = () => videoPlayer.play().catch(() => {});
    if (videoPlayer.paused) tryPlay();
  }

  // Botón de sonido — enteramente independiente del resto del video:
  // solo alterna el estado "muted" y su propio indicador visual.
  const soundToggle = document.getElementById('videoSoundToggle');
  if (videoPlayer && soundToggle) {
    const updateSoundToggle = () => {
      const isUnmuted = !videoPlayer.muted;
      soundToggle.setAttribute('aria-pressed', String(isUnmuted));
      soundToggle.setAttribute(
        'aria-label',
        isUnmuted ? 'Silenciar el video' : 'Activar sonido del video'
      );
    };
    soundToggle.addEventListener('click', () => {
      videoPlayer.muted = !videoPlayer.muted;
      updateSoundToggle();
    });
    updateSoundToggle(); // estado inicial: silenciado
  }

  /* -----------------------------------------------------
     7. FORMULARIO DE CONTACTO
  ----------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Reemplazar por la integración real (fetch a un endpoint, EmailJS, etc.)
      contactForm.reset();
      const btn = contactForm.querySelector('.btn');
      const originalText = btn.textContent;
      btn.textContent = 'MENSAJE ENVIADO';
      setTimeout(() => { btn.textContent = originalText; }, 2600);
    });
  }

  /* -----------------------------------------------------
     8. GSAP + SCROLLTRIGGER — Animaciones
  ----------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    /* --- Hero: entrada al cargar --- */
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero__title-line', { x: -80, opacity: 0, duration: 1, stagger: 0.15 })
      .from('.hero__historia', { x: -60, opacity: 0, duration: 0.9 }, '-=0.6')
      .from('.hero__text', { opacity: 0, y: 20, duration: 0.7 }, '-=0.5')
      .from('.hero__cta', { opacity: 0, y: 20, duration: 0.7 }, '-=0.5')
      .from('.hero__bg', { scale: 1.15, opacity: 0, duration: 1.4, ease: 'power2.out' }, 0);

    /* --- Quienes somos --- */
    gsap.from('.about__photo--1', {
      x: -60, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about', start: 'top 75%' }
    });
    gsap.from('.about__photo--2', {
      x: 60, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.15,
      scrollTrigger: { trigger: '.about', start: 'top 75%' }
    });
    gsap.from('.about__content', {
      opacity: 0, y: 40, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about__content', start: 'top 85%' }
    });

    /* --- Servicios: fade up --- */
    gsap.from('.services__title', {
      opacity: 0, y: 40, duration: 0.9,
      scrollTrigger: { trigger: '.services', start: 'top 80%' }
    });
    gsap.utils.toArray('.service-1, .service-2, .service-3').forEach((item) => {
      gsap.from(item, {
        opacity: 0, y: 50, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%' }
      });
    });
    gsap.from('.services__image', {
      opacity: 0, y: 50, duration: 1,
      scrollTrigger: { trigger: '.services__image', start: 'top 85%' }
    });

    /* --- Video: fade --- */
    gsap.from('.video', {
      opacity: 0, duration: 1.1,
      scrollTrigger: { trigger: '.video', start: 'top 85%' }
    });

    /* --- Resultados: fade --- */
    gsap.from('.results__heading', {
      opacity: 0, y: 30, duration: 1,
      scrollTrigger: { trigger: '.results', start: 'top 80%' }
    });
    gsap.from('.results__images figure', {
      opacity: 0, y: 40, duration: 0.9, stagger: 0.2,
      scrollTrigger: { trigger: '.results__images', start: 'top 85%' }
    });

    /* --- Personaliza tu instrumento --- */
    gsap.from('.pt-title, .pt-title__arrow, .pt-tagline', {
      opacity: 0, x: -40, duration: 1,
      scrollTrigger: { trigger: '.pt-section', start: 'top 80%' }
    });
    gsap.from('.pt-block', {
      opacity: 0, y: 30, duration: 0.8, stagger: 0.12,
      scrollTrigger: { trigger: '.pt-section', start: 'top 70%' }
    });

    /* --- Materiales: fade escalonado --- */
    gsap.from('.materials__title, .materials__desc', {
      opacity: 0, y: 30, duration: 0.9,
      scrollTrigger: { trigger: '.materials', start: 'top 80%' }
    });
    gsap.from('.materials__grid li', {
      opacity: 0, y: 40, duration: 0.7, stagger: 0.15,
      scrollTrigger: { trigger: '.materials__grid', start: 'top 85%' }
    });

    /* --- Cursos: aparición escalonada --- */
    gsap.from('.courses__title, .courses__desc', {
      opacity: 0, y: 30, duration: 0.9,
      scrollTrigger: { trigger: '.courses', start: 'top 80%' }
    });
    gsap.from('.course-card', {
      opacity: 0, y: 50, duration: 0.8, stagger: 0.18,
      scrollTrigger: { trigger: '.courses__grid', start: 'top 82%' }
    });

    /* --- Formulario: fade up --- */
    gsap.from('.contact__text', {
      opacity: 0, y: 30, duration: 1,
      scrollTrigger: { trigger: '.contact', start: 'top 80%' }
    });
    gsap.from('.contact__form', {
      opacity: 0, y: 40, duration: 1, delay: 0.1,
      scrollTrigger: { trigger: '.contact', start: 'top 80%' }
    });

  ScrollTrigger.refresh();
  }

  /* --- Carrusel de Materiales: las flechas mueven el scroll ---
     Fuera del bloque de GSAP a propósito, para que funcione aunque
     GSAP no llegue a cargar. --- */
  const materialsGrid = document.querySelector('.materials__grid');
  const materialsPrev = document.querySelector('.materials__swipe-arrow--left');
  const materialsNext = document.querySelector('.materials__swipe-arrow--right');
  if (materialsGrid && materialsPrev && materialsNext) {
    const scrollByCard = (direction) => {
      const card = materialsGrid.querySelector('.materials__item');
      const cardWidth = card ? card.getBoundingClientRect().width : materialsGrid.clientWidth / 2;
      const gap = 12;
      const distance = (cardWidth + gap) * 2; // mueve de a 2 fotos, nunca deja una tercera a la vista
      materialsGrid.scrollBy({ left: distance * direction, behavior: 'smooth' });
    };
    materialsPrev.addEventListener('click', () => scrollByCard(-1));
    materialsNext.addEventListener('click', () => scrollByCard(1));
  }

  /* --- Botón "INSCRIBIRME" de Introducción a la Luthería: transición
     suave (escala + opacidad) antes de navegar al link externo, para
     que el cambio de página no se sienta tan abrupto. No cambia el
     enlace ni el destino, solo demora la navegación lo justo para que
     se vea la animación. --- */
  const introBtn = document.querySelector('.course-card__btn--1');
  if (introBtn) {
    introBtn.addEventListener('click', (e) => {
      e.preventDefault();
      introBtn.classList.add('is-navigating');
      setTimeout(() => {
        window.location.href = introBtn.href;
      }, 220);
    });
  }
});
