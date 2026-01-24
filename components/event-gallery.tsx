"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface EventItem {
    id: string;
    image_url: string;
    title?: string;
}

export function EventGallery() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const q = query(collection(db, "events"), limit(10));
                const querySnapshot = await getDocs(q);
                const fetchedEvents: EventItem[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedEvents.push({ id: doc.id, ...doc.data() } as EventItem);
                });
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (events.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-serif text-primary text-center mb-8">The Journey</h2>
            {/* Horizontal Scroll Layout for simplicity and "high-end" horizontal vibe */}
            <div className="flex overflow-x-auto space-x-6 pb-8 px-4 scrollbar-hide snap-x">
                {events.map((event, i) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative flex-none w-[300px] h-[400px] rounded-2xl overflow-hidden snap-center group"
                    >
                        <Image
                            src={event.image_url}
                            alt={event.title || "Event Image"}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
