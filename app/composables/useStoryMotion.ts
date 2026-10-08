export function useStoryMotion(root: Ref<HTMLElement | undefined>) {
  let cleanup: (() => void) | undefined;
  let disposed = false;
  onMounted(async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"), import("gsap/ScrollTrigger"),
    ]);
    if (disposed || !root.value) return;
    gsap.registerPlugin(ScrollTrigger);
    const element = root.value;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (min-height: 600px)", () => {
      element.classList.add("motion-ready");
      const ctx = gsap.context(() => {
        const scene = element.querySelector<HTMLElement>(".opening-scene")!;
        const frame = element.querySelector<HTMLElement>(".hero-visual")!;
        const headerHeight = () => window.innerWidth < 700 ? 72 : 88;
        const opening = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: scene, start: () => `top ${headerHeight()}px`,
            end: () => `+=${window.innerHeight * 2.2}`,
            pin: true, scrub: 0.65, invalidateOnRefresh: true,
          },
        });
        opening
          .to(".hero-line", { xPercent: (i) => i % 2 ? 22 : -22, opacity: 0.2, duration: 1 }, 0)
          .to(".hero-sticker", { rotation: 105, scale: 0.7, opacity: 0, duration: 0.8 }, 0)
          .to(".hero-bottomline, .hero-topline, .image-footnote", { autoAlpha: 0, duration: 0.35 }, 0)
          .to(frame, { width: "100%", height: "100%", left: "0%", top: "0%", rotation: 0, borderRadius: 0, duration: 1.2 }, 0)
          .fromTo(".hero-image", { scale: 1.25 }, { scale: 1, duration: 1.2 }, 0)
          .fromTo(".hero-overlay", { autoAlpha: 0, y: 35 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.8)
          .to(".hero-overlay", { autoAlpha: 0, duration: 0.35 }, 1.5)
          .fromTo(".statement", { yPercent: 105, rotation: 5 }, { yPercent: 0, rotation: 0, duration: 1 }, 1.5)
          .to(frame, { scale: 0.88, borderRadius: 40, duration: 1 }, 1.5)
          .from(".statement-word", { x: (i) => i % 2 ? 180 : -180, duration: 0.65, stagger: 0.1 }, 1.7)
          .from(".statement-bottom", { y: 65, opacity: 0, duration: 0.4 }, 2.1)
          .to({}, { duration: 0.25 });
        gsap.to(".story-ribbon span", {
          xPercent: -30, ease: "none",
          scrollTrigger: { trigger: ".story-ribbon", start: "top bottom", end: "bottom top", scrub: true },
        });
        const cards = gsap.utils.toArray<HTMLElement>(".work-stack-card", element);
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card.querySelector(".media-card"), {
            scale: 0.88, rotation: i % 2 ? 3 : -3, ease: "none",
            scrollTrigger: { trigger: next, start: "top 85%", end: () => `top ${headerHeight() + 30}px`, scrub: true, invalidateOnRefresh: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]", element).forEach((el) => {
          gsap.from(el, { y: 70, rotation: 2, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 93%", toggleActions: "play none none reverse" },
          });
        });
        gsap.from(".service-image", { rotation: -12, scale: 0.8,
          scrollTrigger: { trigger: ".services-section", start: "top bottom", end: "top 15%", scrub: true },
        });
        gsap.from(".process-grid article", { y: 100, rotation: (i) => i % 2 ? 6 : -6, stagger: 0.12,
          scrollTrigger: { trigger: ".process-grid", start: "top 95%", end: "top 35%", scrub: 0.6 },
        });
        gsap.from(".about-grid h2", { xPercent: -12,
          scrollTrigger: { trigger: ".about-section", start: "top bottom", end: "top 15%", scrub: true },
        });
        const footer = document.querySelector(".contact-section");
        if (footer) gsap.from(footer.querySelector(".contact-heading"), {
          y: 100, scale: 0.85, rotation: -2, transformOrigin: "left bottom",
          scrollTrigger: { trigger: footer, start: "top bottom", end: "top 30%", scrub: 0.6 },
        });
      }, element);
      return () => { ctx.revert(); element.classList.remove("motion-ready"); };
    });
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      if (!disposed) timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(element);
    element.addEventListener("load", refresh, true);
    document.fonts.ready.then(refresh);
    cleanup = () => {
      clearTimeout(timer);
      observer.disconnect();
      element.removeEventListener("load", refresh, true);
      mm.revert();
    };
    refresh();
  });
  onBeforeUnmount(() => { disposed = true; cleanup?.(); });
}

