"use client";

import { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export function SmoothScroll({ children }: { children: ReactNode }) {
    return (
        <ReactLenis root>
            {children}
        </ReactLenis>
    );
}
