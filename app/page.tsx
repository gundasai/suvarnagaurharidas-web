"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseGrid } from "@/components/course-grid";
import { EventGallery } from "@/components/event-gallery";
import { Footer } from "@/components/footer";
import { MapPin, Clock } from "lucide-react";
import Image from "next/image";

interface ScheduleItem { id: string; title: string; date: string; time: string; location: string; active: boolean; }
interface ProfileData { bio?: string; responsibilities?: string; education?: string; }
interface PostItem { id: string; title: string; content: string; images: string[]; created_at: { seconds: number, nanoseconds: number } | null; }

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false); // Default to false to show UI immediately

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch all independently (fault tolerance)
        const results = await Promise.allSettled([
          getDocs(collection(db, "schedule")),
          getDocs(collection(db, "profile")),
          getDocs(collection(db, "posts"))
        ]);

        if (!isMounted) return;

        // 1. Schedule
        if (results[0].status === "fulfilled") {
          setSchedule(results[0].value.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
        } else {
          console.error("Schedule fetch failed", results[0].reason);
        }

        // 2. Profile
        if (results[1].status === "fulfilled") {
          if (!results[1].value.empty) {
            setProfile(results[1].value.docs[0].data() as ProfileData);
          }
        }

        // 3. Posts
        if (results[2].status === "fulfilled") {
          const allPosts = results[2].value.docs.map(d => ({ id: d.id, ...d.data() } as PostItem));
          // Client-side sort
          allPosts.sort((a, b) => {
            const tA = a.created_at?.seconds || 0;
            const tB = b.created_at?.seconds || 0;
            return tB - tA;
          });
          setPosts(allPosts.slice(0, 3));
        }

      } catch (error) {
        console.error("Critical fetching error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();

    return () => { isMounted = false; };
  }, []);

  // Removed blocking loader to allow immediate rendering of static content (Hero, etc.)
  if (loading) {
    // We are checking for initial mount, but we want to render immediately.
    // The previous blocking code is removed.
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] selection:bg-secondary selection:text-black overflow-x-hidden">

      {/* Navbar (Simple floating) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md border border-white/40 shadow-sm rounded-full px-8 py-3 flex gap-8 text-sm font-medium tracking-wide text-neutral-600">
        <a href="#about" className="hover:text-primary transition-colors">About</a>
        <a href="#courses" className="hover:text-primary transition-colors">Courses</a>
        {schedule.length > 0 && <a href="#upcoming" className="hover:text-primary transition-colors">Upcoming</a>}
        {posts.length > 0 && <a href="#programs" className="hover:text-primary transition-colors">Recent Programs</a>}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-6 lg:px-12">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-[-10%] right-[-5%] w-[50vh] h-[50vh] rounded-full bg-secondary/10 blur-3xl animate-pulse delay-75"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] rounded-full bg-primary/5 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Image Side */}
          <div className="relative order-first lg:order-last flex justify-center">
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-20 blur-2xl transform scale-105"></div>
              <div className="relative w-full h-full rounded-full border-[8px] border-white shadow-2xl overflow-hidden bg-orange-100">
                <Image
                  src="/monk-profile.png"
                  alt="Suvarna Gaura Hari Das"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-2">
              <h2 className="text-primary font-semibold tracking-widest uppercase text-sm md:text-base mb-4">Shiv Kumar Sangappa Salegar</h2>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-neutral-800 leading-[1.1]">
                Suvarna Gaura <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">Hari Das</span>
              </h1>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-neutral-500 font-medium text-lg">
              <span>Monk</span>
              <span className="text-secondary">•</span>
              <span>Educator</span>
              <span className="text-secondary">•</span>
              <span>Mentor</span>
              <span className="text-secondary">•</span>
              <span>Life Coach</span>
            </div>

            <p className="text-xl text-neutral-600 italic font-serif">
              &quot;Bridging Ancient Wisdom with Modern Living&quot;
            </p>

            <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center lg:justify-start">
              <a href="#about" className="bg-primary text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all">
                My Journey
              </a>
              <a href="#courses" className="bg-white text-neutral-800 border border-neutral-200 px-8 py-3 rounded-full font-medium hover:bg-neutral-50 transition-colors">
                Watch Videos
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <h2 className="text-4xl font-serif text-neutral-800">The Journey</h2>
            <div className="relative border-l-2 border-orange-100 ml-3 pl-8 pb-2 space-y-8">
              {(() => {
                const rawText = profile?.bio || "Shiv Kumar Sangappa Salegar (Suvarna Gaur Hari Das) began his journey in the corporate world as an IBM Engineer. In 2012, driven by a deeper calling, he embraced the life of a monk at ISKCON.\n\nToday, he transforms lives by blending his analytical roots with profound spiritual insights.";

                // Smart cleanup for broken lines
                const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
                const cleaned: string[] = [];

                lines.forEach(line => {
                  if (cleaned.length === 0) {
                    cleaned.push(line);
                  } else {
                    const last = cleaned[cleaned.length - 1];
                    // Merge if last line looks incomplete (no punctuation) OR current line starts with lowercase
                    const lastEndedWithError = !/[.!?)]$/.test(last);
                    const currentIsContinuation = /^[a-z]/.test(line);

                    if (lastEndedWithError || currentIsContinuation) {
                      cleaned[cleaned.length - 1] = last + " " + line;
                    } else {
                      cleaned.push(line);
                    }
                  }
                });

                return cleaned.map((paragraph, index) => (
                  <div key={index} className="relative">
                    <span className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full border-4 border-white bg-orange-200 shadow-sm"></span>
                    <p className="text-neutral-600 leading-relaxed text-lg">{paragraph}</p>
                  </div>
                ));
              })()}
            </div>

            {profile?.education && (
              <div className="pt-4 bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                <h3 className="text-lg font-bold text-primary mb-3">Education & Career</h3>
                <div className="whitespace-pre-wrap text-neutral-600 text-sm leading-relaxed">{profile.education}</div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-serif text-neutral-800">Current Responsibilities</h3>
            {profile?.responsibilities ? (
              <ul className="grid gap-4">
                {profile.responsibilities.split('\n').map((resp, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-white shadow-sm border border-transparent hover:border-orange-100 transition-colors">
                    <div className="min-w-[40px] h-[40px] rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold">
                      {i + 1}
                    </div>
                    <div className="text-neutral-700 font-medium pt-2">{resp}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">Loading...</p>
            )}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Wisdom Library</span>
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-800">Video Discourses</h2>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <CourseGrid />
        </div>
      </section>

      {/* Upcoming (Schedule) Section */}
      {schedule.length > 0 && (
        <section id="upcoming" className="py-24 px-6 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-serif">Upcoming Sessions</h2>
            </div>

            <div className="space-y-4">
              {schedule.map((item, i) => (
                <div key={i} className="bg-white text-neutral-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-6 transform hover:scale-[1.01] transition-transform">
                  <div className="flex-shrink-0 text-center w-full md:w-24 bg-orange-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{item.date.split(' ')[0]}</div>
                    <div className="text-xl font-serif text-neutral-800 font-bold">{item.date.replace(/^[a-zA-Z]+, /, '')}</div>
                  </div>
                  <div className="flex-grow text-center md:text-left space-y-1">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {item.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {item.location}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="bg-neutral-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Programs (Posts) Section */}
      {posts.length > 0 && (
        <section id="programs" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">Community</span>
              <h2 className="text-4xl font-serif text-neutral-800 mt-2">Recent Programs</h2>
            </div>

            <div className="grid gap-8">
              {posts.map(post => (
                <div key={post.id} className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-orange-100 relative">
                      <Image src="/monk-profile.png" alt="Profile" fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-neutral-800">{post.title}</h3>
                      <p className="text-xs text-neutral-400">Suvarna Gaura Hari Das • Check Update</p>
                    </div>
                  </div>

                  <p className="text-neutral-600 leading-relaxed mb-6 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Image Grid */}
                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' :
                      post.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2 md:grid-cols-3'
                      }`}>
                      {post.images.map((img, i) => (
                        <div key={i} className={`relative rounded-xl overflow-hidden bg-neutral-100 ${post.images.length === 3 && i === 0 ? 'md:col-span-2 md:row-span-2 aspect-video' : 'aspect-square'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Post image" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section className="py-24 bg-white">
        <EventGallery />
      </section>

      <Footer />
    </main>
  );
}
