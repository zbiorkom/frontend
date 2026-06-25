import { useEffect, useRef, useState } from "react";
import styles from "./Reveal.module.less";

type Props = {
    children: React.ReactNode;
    /** stagger delay in ms */
    delay?: number;
    className?: string;
    as?: "div" | "section" | "li";
};

/**
 * Reveals its children with a soft fade + rise the first time it scrolls
 * into view. Honors prefers-reduced-motion by showing instantly.
 */
export default ({ children, delay = 0, className, as = "div" }: Props) => {
    const ref = useRef<HTMLElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            setShown(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const Tag = as as "div";
    return (
        <Tag
            ref={ref as React.Ref<HTMLDivElement>}
            className={`${styles.reveal} ${shown ? styles.shown : ""} ${className ?? ""}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </Tag>
    );
};
