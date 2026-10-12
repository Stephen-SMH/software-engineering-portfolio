import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Briefcase, DownloadSimple, EnvelopeSimple, Folders, Rows, SidebarSimple, TerminalWindow, User, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Dict, Locale } from "@/content";
import { withBase } from "./ui";

/**
 * The only React island: it owns the mobile-menu state and the sliding
 * active-section pill. Theme + language controls arrive as Astro slots.
 */
export function Nav({
  locale,
  brand,
  nav,
  controls,
}: {
  locale: Locale;
  brand: Dict["brand"];
  nav: Dict["nav"];
  controls?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"top" | "side">("top");

  // Menu layout (top bar or left rail) is a visitor preference.
  useLayoutEffect(() => {
    let m: "top" | "side" = "top";
    try { if (localStorage.getItem("navmode") === "side") m = "side"; } catch {}
    setMode(m);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.navmode = mode;
    try { localStorage.setItem("navmode", mode); } catch {}
  }, [mode]);
  const toggleMode = () => setMode((m) => (m === "top" ? "side" : "top"));
  const icons: Record<string, typeof User> = { about: User, skills: Wrench, experience: Briefcase, projects: Folders, contact: EnvelopeSimple };

  const links = [
    { id: "about", label: nav.about },
    { id: "skills", label: nav.skills },
    { id: "experience", label: nav.experience },
    { id: "projects", label: nav.projects },
    { id: "contact", label: nav.contact },
  ];

  // Highlights the section in view. IntersectionObserver, not a scroll listener.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One pill slides between links instead of each link flipping its own background.
  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [active]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("scroll-lock", { detail: open }));
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ease = "ease-[cubic-bezier(0.32,0.72,0,1)]";

  return (
    <>
      <header data-nav suppressHydrationWarning className="nav-top pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
        <div className="glass tn-bar pointer-events-auto flex max-w-full items-center gap-2 rounded-full p-2.5">
          <a
            href={withBase(`/${locale}/`)}
            data-astro-reload=""
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-3.5 pl-4 pr-3 font-mono text-[15px] font-medium text-ink xl:pl-6 xl:pr-5 xl:text-[17px]"
          >
            <span className="tn-tilde">~</span>
            {brand.handle}
          </a>

          <nav ref={listRef} className="relative hidden items-center gap-1 lg:flex" aria-label="Sections">
            <span
              aria-hidden="true"
              className={`tn-active absolute inset-y-0 left-0 rounded-full transition-[transform,width,opacity] duration-700 ${ease}`}
              style={{ width: pill?.w ?? 0, transform: `translateX(${pill?.x ?? 0}px)`, opacity: pill ? 1 : 0 }}
            />
            {links.map((l) => (
              <a
                key={l.id}
                data-id={l.id}
                href={`#${l.id}`}
                aria-current={active === l.id ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-3.5 text-[15px] font-medium xl:px-6 xl:text-[16px] tracking-tight transition-colors duration-500 ${
                  active === l.id ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-1 flex items-center gap-1">
            <button type="button" onClick={toggleMode} aria-label="Switch to side menu" title="Side menu" className="hidden h-12 w-12 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/10 hover:text-ink lg:grid">
              <SidebarSimple size={22} weight="light" />
            </button>
            {/* Below sm the bar has no room for these; they live in the mobile menu. */}
            <div className="hidden sm:contents">{controls}</div>
            <a href={withBase("/cv.pdf")} download className="btn btn-primary hero-cta ml-1 hidden !pl-5 !text-[15px] md:inline-flex xl:!pl-6 xl:!text-[16px]">
              {nav.downloadCv}
              <span className="btn-icon !h-10 !w-10" aria-hidden="true">
                <DownloadSimple size={15} weight="light" />
              </span>
            </a>
            <button
              type="button"
              aria-label={nav.menu}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="relative ml-0.5 h-10 w-10 shrink-0 rounded-full bg-ink/8 lg:hidden"
            >
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 bg-ink transition-transform duration-700 ${ease} ${
                  open ? "rotate-45" : "-translate-y-[3.5px]"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 bg-ink transition-transform duration-700 ${ease} ${
                  open ? "-rotate-45" : "translate-y-[3.5px]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <aside data-nav-side aria-label="Primary" className="nav-side rail fixed inset-y-0 left-0 z-50 hidden w-[72px] flex-col items-center py-3 lg:flex">
        <a href={withBase(`/${locale}/`)} data-astro-reload="" data-tip={brand.handle} className="rail-btn rail-logo">
          <span className="grid h-10 w-10 place-items-center rounded-2xl text-[16px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#f472b6,#6366f1)" }}>S</span>
        </a>
        <i className="rail-sep" aria-hidden="true" />
        <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Sections">
          {links.map((l) => {
            const Ico = icons[l.id] ?? User;
            const on = active === l.id;
            return (
              <a key={l.id} href={`#${l.id}`} data-tip={l.label} aria-label={l.label} aria-current={on ? "true" : undefined} className="rail-btn">
                <span aria-hidden="true" className="rail-pill" />
                <Ico size={24} weight={on ? "fill" : "light"} />
              </a>
            );
          })}
          <a href="#terminal" data-tip="Terminal" aria-label="Terminal" className="rail-btn">
            <span aria-hidden="true" className="rail-pill" />
            <TerminalWindow size={24} weight="light" />
          </a>
        </nav>
        <div className="flex w-full flex-col items-center gap-2 px-2">
          <a href={withBase("/cv.pdf")} download data-tip={nav.downloadCv} aria-label={nav.downloadCv} className="rail-btn rail-cta">
            <DownloadSimple size={24} weight="light" />
          </a>
          <button type="button" onClick={toggleMode} data-tip="Top menu" aria-label="Switch to top menu" className="rail-btn">
            <Rows size={24} weight="light" />
          </button>
          <i className="rail-sep" aria-hidden="true" />
          <div className="rail-controls">{controls}</div>
        </div>
      </aside>

      <div
        id="mobile-menu"
        data-lenis-prevent
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-paper/85 px-8 backdrop-blur-3xl transition-[opacity,clip-path] duration-700 ${ease} lg:hidden ${
          open ? "opacity-100 [clip-path:circle(150%_at_90%_5%)]" : "pointer-events-none opacity-0 [clip-path:circle(0%_at_90%_5%)]"
        }`}
      >
        <nav aria-label="Sections" className="flex flex-col gap-1">
          {links.map((l, i) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${160 + i * 60}ms` : "0ms" }}
              className={`font-display text-5xl font-semibold tracking-tighter text-ink transition-all duration-700 ${ease} ${
                open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href={withBase("/cv.pdf")}
            download
            style={{ transitionDelay: open ? `${160 + links.length * 60}ms` : "0ms" }}
            className={`btn btn-primary mt-8 w-max transition-all duration-700 ${ease} ${
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            {nav.downloadCv}
            <span className="btn-icon" aria-hidden="true">
              <DownloadSimple size={16} weight="light" />
            </span>
          </a>
          <div
            style={{ transitionDelay: open ? `${220 + links.length * 60}ms` : "0ms" }}
            className={`mt-6 flex items-center gap-2 transition-all duration-700 sm:hidden ${ease} ${
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            {controls}
          </div>
        </nav>
      </div>
    </>
  );
}
