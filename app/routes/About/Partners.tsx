import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Partners.module.less";

type Partner = {
    name: string;
    href: string;
    color: string;
    Logo: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
};

/* Original stylized wordmarks — grayscale by default, brand color on hover. */
const Metroline = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 160 48" {...p}>
        <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
        <rect x="20" y="10" width="8" height="28" rx="4" fill="currentColor" />
        <text x="46" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            Metroline
        </text>
    </svg>
);

const Tramly = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 150 48" {...p}>
        <rect x="8" y="12" width="30" height="22" rx="6" fill="currentColor" />
        <circle cx="16" cy="38" r="3.5" fill="currentColor" />
        <circle cx="30" cy="38" r="3.5" fill="currentColor" />
        <text x="46" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            Tramly
        </text>
    </svg>
);

const RailGo = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 140 48" {...p}>
        <path d="M10 30 L30 10 L30 30 Z" fill="currentColor" />
        <rect x="12" y="30" width="20" height="5" rx="2.5" fill="currentColor" />
        <text x="40" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            RailGo
        </text>
    </svg>
);

const BusPay = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 150 48" {...p}>
        <rect x="8" y="14" width="32" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
        <rect x="8" y="20" width="32" height="5" fill="currentColor" />
        <text x="48" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            BusPay
        </text>
    </svg>
);

const Komet = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 140 48" {...p}>
        <circle cx="22" cy="24" r="12" fill="currentColor" />
        <path d="M30 24 L48 16 L44 24 L48 32 Z" fill="currentColor" />
        <text x="54" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            Komet
        </text>
    </svg>
);

const Stoply = (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 150 48" {...p}>
        <path
            d="M16 8 L32 8 L40 16 L40 32 L32 40 L16 40 L8 32 L8 16 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
        />
        <circle cx="24" cy="24" r="6" fill="currentColor" />
        <text x="48" y="31" fontSize="20" fontWeight="800" fill="currentColor">
            Stoply
        </text>
    </svg>
);

const PARTNERS: Partner[] = [
    { name: "Metroline", href: "https://example.com/metroline", color: "#e8462d", Logo: Metroline },
    { name: "Tramly", href: "https://example.com/tramly", color: "#2d8ce8", Logo: Tramly },
    { name: "RailGo", href: "https://example.com/railgo", color: "#9b2de8", Logo: RailGo },
    { name: "BusPay", href: "https://example.com/buspay", color: "#0fa958", Logo: BusPay },
    { name: "Komet", href: "https://example.com/komet", color: "#f0a500", Logo: Komet },
    { name: "Stoply", href: "https://example.com/stoply", color: "#e8327c", Logo: Stoply },
];

export default () => {
    const { t } = useTranslation();
    const trackRef = useRef<HTMLDivElement>(null);

    // Auto-scrolling marquee that is also drag-scrollable. We drive a single
    // translateX via rAF and wrap at half the (duplicated) track width so it
    // loops seamlessly. Dragging or hovering pauses the auto-advance.
    const offset = useRef(0);
    const half = useRef(0);
    const dragging = useRef(false);
    const hovering = useRef(false);
    const moved = useRef(false);
    const startX = useRef(0);
    const startOffset = useRef(0);
    const lastTs = useRef<number | null>(null);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const measure = () => {
            half.current = track.scrollWidth / 2;
        };
        measure();
        window.addEventListener("resize", measure);

        let raf = 0;
        const speed = 35; // px per second

        const tick = (ts: number) => {
            if (lastTs.current == null) lastTs.current = ts;
            const dt = (ts - lastTs.current) / 1000;
            lastTs.current = ts;

            if (!dragging.current && !hovering.current) {
                offset.current -= speed * dt;
            }
            if (half.current > 0) {
                while (offset.current <= -half.current) offset.current += half.current;
                while (offset.current > 0) offset.current -= half.current;
            }
            track.style.transform = `translate3d(${offset.current}px,0,0)`;
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", measure);
        };
    }, []);

    const onPointerDown = (e: React.PointerEvent) => {
        dragging.current = true;
        moved.current = false;
        startX.current = e.clientX;
        startOffset.current = offset.current;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging.current) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 4) moved.current = true;
        offset.current = startOffset.current + dx;
    };

    const onPointerUp = (e: React.PointerEvent) => {
        dragging.current = false;
        lastTs.current = null;
        try {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
            /* pointer already released */
        }
    };

    return (
        <div
            className={styles.viewport}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={() => (hovering.current = true)}
            onMouseLeave={() => {
                hovering.current = false;
                lastTs.current = null;
            }}
        >
            <div className={styles.track} ref={trackRef}>
                {[...PARTNERS, ...PARTNERS].map((partner, i) => (
                    <a
                        key={`${partner.name}-${i}`}
                        className={styles.logo}
                        href={partner.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("about.partners.visit", { name: partner.name })}
                        style={{ ["--brand" as string]: partner.color }}
                        draggable={false}
                        // Suppress navigation if the pointer was dragged.
                        onClickCapture={(e) => {
                            if (moved.current) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    >
                        <partner.Logo className={styles.svg} />
                    </a>
                ))}
            </div>
            <div className={`${styles.fade} ${styles.fadeLeft}`} aria-hidden="true" />
            <div className={`${styles.fade} ${styles.fadeRight}`} aria-hidden="true" />
        </div>
    );
};
