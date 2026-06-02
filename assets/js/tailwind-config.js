/** Configuração Tailwind compartilhada — todas as oficinas NAVE */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "surface-container-lowest": "#ffffff",
                "surface-container-high": "#e7e8e9",
                "on-primary-fixed-variant": "#00419f",
                "secondary-fixed-dim": "#ffb1c4",
                "inverse-primary": "#b1c5ff",
                "surface": "#f8f9fa",
                "surface-variant": "#e1e3e4",
                "error-container": "#ffdad6",
                "secondary-container": "#db266f",
                "tertiary-fixed": "#e2e2e2",
                "secondary": "#b60057",
                "outline": "#737786",
                "outline-variant": "#c2c6d6",
                "on-error": "#ffffff",
                "surface-container": "#edeeef",
                "primary-fixed-dim": "#b1c5ff",
                "inverse-surface": "#2e3132",
                "on-tertiary-fixed": "#1b1b1b",
                "on-tertiary": "#ffffff",
                "primary": "#004ab3",
                "on-primary": "#ffffff",
                "surface-dim": "#d9dadb",
                "on-surface": "#191c1d",
                "on-surface-variant": "#424654",
                "surface-tint": "#0057cf",
                "error": "#ba1a1a",
                "surface-container-low": "#f3f4f5",
                "tertiary-container": "#686868",
                "on-secondary": "#ffffff",
                "primary-container": "#1561de",
                "primary-fixed": "#dae2ff",
                "background": "#f8f9fa",
                "tertiary-fixed-dim": "#c6c6c6",
                "on-primary-fixed": "#001946",
                "on-error-container": "#93000a",
                "on-secondary-fixed-variant": "#8f0043",
                "on-tertiary-container": "#e8e8e8",
                "surface-bright": "#f8f9fa",
                "tertiary": "#505050",
                "on-background": "#191c1d",
                "on-secondary-container": "#fffbff",
                "surface-container-highest": "#e1e3e4",
                "on-tertiary-fixed-variant": "#474747",
                "on-primary-container": "#e3e8ff",
                "inverse-on-surface": "#f0f1f2",
                "on-secondary-fixed": "#3f001a",
                "secondary-fixed": "#ffd9e0"
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                lg: "0.5rem",
                xl: "0.75rem",
                full: "9999px"
            },
            spacing: {
                "max-width": "1280px",
                base: "8px",
                "margin-desktop": "64px",
                "margin-mobile": "16px",
                gutter: "24px"
            },
            fontFamily: {
                "body-md": ["Lexend"],
                "label-md": ["Lexend"],
                "headline-md": ["Lexend"],
                "headline-lg-mobile": ["Lexend"],
                "label-sm": ["Lexend"],
                "display-lg": ["Lexend"],
                "headline-lg": ["Lexend"],
                "headline-sm": ["Lexend"],
                "body-lg": ["Lexend"]
            },
            fontSize: {
                "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
                "label-md": ["14px", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
                "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
                "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "600" }],
                "label-sm": ["12px", { lineHeight: "1.2", fontWeight: "600" }],
                "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
                "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
                "headline-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
                "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }]
            }
        }
    }
};
