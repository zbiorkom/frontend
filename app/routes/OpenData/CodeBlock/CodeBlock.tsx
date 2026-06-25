import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import styles from "./CodeBlock.module.less";

// Register once at module load (idempotent across re-imports).
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);

export type CodeLang = "typescript" | "json" | "xml";

type Props = {
    code: string;
    lang: CodeLang;
    /** optional label shown in the header bar */
    label?: string;
};

export default ({ code, lang, label }: Props) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const html = useMemo(() => {
        try {
            return hljs.highlight(code, { language: lang }).value;
        } catch {
            return null;
        }
    }, [code, lang]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            /* clipboard unavailable */
        }
    };

    return (
        <figure className={styles.block}>
            <figcaption className={styles.bar}>
                <span className={styles.lang}>{label ?? lang}</span>
                <button type="button" className={styles.copy} onClick={copy}>
                    {copied ? t("openData.builder.copied") : t("openData.builder.copy")}
                </button>
            </figcaption>
            <pre className={styles.pre}>
                {html !== null ? (
                    <code dangerouslySetInnerHTML={{ __html: html }} />
                ) : (
                    <code>{code}</code>
                )}
            </pre>
        </figure>
    );
};
