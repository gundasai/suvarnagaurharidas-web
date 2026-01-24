"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getYouTubeThumbnail, getYouTubeThumbnailFallback } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    title: string;
    youtubeUrl: string;
    className?: string;
}

export function GlassCard({ title, youtubeUrl, className }: GlassCardProps) {
    const [imgSrc, setImgSrc] = useState(getYouTubeThumbnail(youtubeUrl));
    const fallbackSrc = getYouTubeThumbnailFallback(youtubeUrl);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-white shadow-lg shadow-neutral-100 hover:shadow-orange-200/50 transition-all duration-300 border border-neutral-100",
                className
            )}
        >
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video w-full overflow-hidden">
                <Image
                    src={imgSrc}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgSrc(fallbackSrc)}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-lg scale-90 opacity-80 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        <Play className="w-6 h-6 text-primary fill-primary ml-1" />
                    </div>
                </div>
            </a>
            <div className="p-5">
                <h3 className="text-lg font-serif font-semibold text-neutral-800 group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 font-medium tracking-wide uppercase">Watch Now</p>
            </div>
        </motion.div>
    );
}
