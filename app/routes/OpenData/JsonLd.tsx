// Renders a JSON-LD <script> block for structured data (schema.org).
// Used to surface the open-data catalog to Google (incl. Dataset Search).
export default ({ data }: { data: unknown }) => (
    <script
        type="application/ld+json"
        // JSON.stringify output is safe to inline; no user-controlled HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
);
