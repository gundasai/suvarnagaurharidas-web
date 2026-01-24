"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlassCard } from "./glass-card";
import { Loader2 } from "lucide-react";

interface Course {
    id: string;
    title: string;
    youtube_url: string;
}

export function CourseGrid() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const q = query(collection(db, "courses"), limit(6)); // Auto-order? no field specified.
                const querySnapshot = await getDocs(q);
                const fetchedCourses: Course[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
                });
                setCourses(fetchedCourses);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="text-center p-12 text-neutral-500">
                No courses found.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
                <GlassCard key={course.id} title={course.title} youtubeUrl={course.youtube_url} />
            ))}
        </div>
    );
}
