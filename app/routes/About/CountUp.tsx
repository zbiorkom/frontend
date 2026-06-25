import { useEffect, useRef, useState } from "react";

type Props = {
    /** target number to count up to */
    value: number;
    /** rendered before the number, e.g. "" */
    prefix?: string;
    /** rendered after the number, e.g. "+", "k", " mln" */
    suffix?: string;
    duration?: number;
};

/** Counts from 0 to `value` once it scrolls into view. */
export default ({ value, prefix = "", suffix = "", duration = 1600 }: Props) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            setDisplay(value);
            return;
        }

        let raf = 0;
        let start: number | null = null;

        const run = (ts: number) => {
            if (start === null) start = ts;
            const t = Math.min((ts - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(eased * value));
            if (t < 1) raf = requestAnimationFrame(run);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    raf = requestAnimationFrame(run);
                    observer.disconnect();
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(el);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [value, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {display.toLocaleString("pl-PL")}
            {suffix}
        </span>
    );
};
