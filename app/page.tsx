"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseGrid } from "@/components/course-grid";
// import { EventGallery } from "@/components/event-gallery";
import { Footer } from "@/components/footer";
import { MapPin, Clock, ArrowRight, Menu, X, Sparkles, ExternalLink, User, Video, BookOpen, Calendar, MessageSquarePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BlogItem } from "@/lib/blogs";
import { parseDateBadge, isEventUpcoming } from "@/lib/utils";

interface ScheduleItem { id: string; title: string; date: string; end_date?: string; time: string; location: string; active: boolean; }
interface ProfileData { bio?: string; responsibilities?: string; education?: string; }
interface PostItem { id: string; title: string; content: string; images: string[]; created_at: { seconds: number, nanoseconds: number } | null; }

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch all independently (fault tolerance)
        const results = await Promise.allSettled([
          getDocs(collection(db, "schedule")),
          getDocs(collection(db, "profile")),
          getDocs(collection(db, "posts")),
          getDocs(collection(db, "blogs"))
        ]);

        if (!isMounted) return;

        // 1. Schedule
        if (results[0].status === "fulfilled") {
          setSchedule(results[0].value.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
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
          allPosts.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
          setPosts(allPosts);
        }

        // 4. Blogs
        if (results[3].status === "fulfilled") {
          const fetchedBlogs = results[3].value.docs.map(d => ({ id: d.id, ...d.data() } as BlogItem));
          fetchedBlogs.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
          setBlogs(fetchedBlogs);
        }

      } catch (error) {
        console.error("Critical fetching error:", error);
      }
    }
    fetchData();

    return () => { isMounted = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7] selection:bg-secondary selection:text-black overflow-x-hidden">

      {/* Desktop & Laptop Navbar (Centered Floating Glass Pill) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-3 bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 rounded-full px-6 py-2.5 transition-all">
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#courses" className="hover:text-primary transition-colors">Courses</a>
          <a href="#blogs" className="hover:text-primary transition-colors">Blogs</a>
          {schedule.length > 0 && <a href="#upcoming" className="hover:text-primary transition-colors">Upcoming</a>}
          {posts.length > 0 && <a href="#programs" className="hover:text-primary transition-colors">Recent Programs</a>}
        </nav>

        <div className="h-4 w-[1px] bg-neutral-200/80 mx-1"></div>

        {/* Highlighted Gita Wisdom Button */}
        <a
          href="https://gita-wisdom.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-full px-5 py-2 text-xs md:text-sm font-bold tracking-wide shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>Gita Wisdom Course</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Mobile Navbar Header */}
      <div className="fixed top-4 left-4 right-4 z-50 flex md:hidden items-center justify-between bg-white/90 backdrop-blur-xl border border-neutral-200/80 shadow-lg rounded-full px-4 py-2.5">
        <a href="#about" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-200 relative shrink-0 bg-orange-100">
            <Image src="/monk-profile.png" alt="Profile" fill className="object-cover" />
          </div>
          <span className="font-serif font-bold text-sm text-neutral-800">Suvarna Gaura Hari</span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href="https://gita-wisdom.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>Gita Wisdom</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-700 hover:text-primary transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 z-40 md:hidden bg-white/95 backdrop-blur-2xl border border-neutral-200/80 shadow-2xl rounded-3xl p-6 flex flex-col space-y-3 font-medium text-neutral-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <User className="w-5 h-5 text-primary" /> About
          </a>
          <a
            href="#courses"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <Video className="w-5 h-5 text-primary" /> Courses
          </a>
          <a
            href="#blogs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <BookOpen className="w-5 h-5 text-primary" /> Spiritual Blogs
          </a>
          {schedule.length > 0 && (
            <a
              href="#upcoming"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:text-primary transition-colors"
            >
              <Calendar className="w-5 h-5 text-primary" /> Upcoming Sessions
            </a>
          )}
          {posts.length > 0 && (
            <a
              href="#programs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 hover:text-primary transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5 text-primary" /> Recent Programs
            </a>
          )}

          <div className="pt-2 border-t border-neutral-100">
            <a
              href="https://gita-wisdom.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-3.5 text-center font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Gita Wisdom Course</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-6 lg:px-12">
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
      <section id="about" className="py-24 px-4 md:px-6 bg-[#FDFBF7]">
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
      <section id="courses" className="py-24 px-4 md:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Wisdom Library</span>
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-800">Video Discourses</h2>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <CourseGrid />
        </div>
      </section>

      {/* Blogs Section */}
      <section id="blogs" className="py-24 px-4 md:px-6 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">Articles & Reflections</span>
            <h2 className="text-4xl md:text-5xl font-serif text-neutral-800">Spiritual Blogs</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto text-base md:text-lg">
              Explore deep insights on Vedic wisdom, mindfulness, personal transformation, and practical spirituality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-white rounded-3xl overflow-hidden border border-neutral-200/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-orange-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.image || "/monk-profile.png"}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-neutral-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    Wisdom Article
                  </div>
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xl font-serif font-bold text-neutral-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">
                      {blog.summary || (blog.content ? blog.content.replace(/<[^>]*>?/gm, "").substring(0, 140) + "..." : "")}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-medium text-neutral-400">
                      {blog.author || "Suvarna Gaura Hari Das"}
                    </span>
                    <Link
                      href={`/blog/${blog.id}`}
                      className="text-sm font-semibold text-primary hover:text-orange-700 flex items-center gap-1.5 transition-colors group/btn"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Sessions Section */}
      {schedule.filter(isEventUpcoming).length > 0 && (
        <section id="upcoming" className="py-24 px-4 md:px-6 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-serif">Upcoming Sessions</h2>
            </div>

            <div className="space-y-4">
              {schedule.filter(isEventUpcoming).map((item, i) => {
                const { month, day } = parseDateBadge(item.date);
                return (
                  <div key={i} className="bg-white text-neutral-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-6 transform hover:scale-[1.01] transition-transform">
                    <div className="flex-shrink-0 text-center w-full md:w-28 bg-orange-50/90 border border-orange-200/60 rounded-2xl p-3 flex flex-col justify-center items-center shadow-sm">
                      <span className="text-[11px] font-bold text-primary tracking-wider uppercase mb-0.5">{month}</span>
                      <span className="text-xl md:text-2xl font-serif text-neutral-800 font-bold leading-none">{day}</span>
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
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent Programs (Posts) Section */}
      {posts.length > 0 && (
        <section id="programs" className="py-24 px-4 md:px-6 bg-white">
          <div className="w-full max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">Community</span>
              <h2 className="text-3xl md:text-5xl font-serif text-neutral-800 mt-2">Recent Programs</h2>
            </div>

            <div className="grid gap-8">
              {posts.map(post => (
                <div key={post.id} className="bg-white border border-neutral-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow w-full max-w-full overflow-hidden">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-orange-100 relative shrink-0">
                      <Image src="/monk-profile.png" alt="Profile" fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-neutral-800 break-words">{post.title}</h3>
                      <p className="text-xs text-neutral-400">Suvarna Gaura Hari Das • Check Update</p>
                    </div>
                  </div>

                  <p className="text-neutral-600 leading-relaxed mb-6 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {/* Image Grid */}
                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 w-full max-w-full ${post.images.length === 1 ? 'grid-cols-1' :
                      post.images.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      }`}>
                      {post.images.map((img, i) => (
                        <div key={i} className={`relative rounded-xl overflow-hidden bg-neutral-100 w-full max-w-full ${post.images.length === 3 && i === 0 ? 'md:col-span-2 md:row-span-2 aspect-video' : 'aspect-square'}`}>
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

      {/* Gallery Section Removed */}
      {/* <section className="py-24 bg-white">
        <EventGallery />
      </section> */}

      <Footer />
    </main>
  );
}
