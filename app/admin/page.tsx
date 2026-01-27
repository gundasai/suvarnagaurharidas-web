"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, setDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { db, auth, googleProvider } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Loader2, Trash2, Save, Calendar, Video, User as UserIcon, LogOut, MessageSquarePlus, Edit, X } from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface Course { id: string; title: string; youtube_url: string; }
// interface EventItem { id: string; image_url: string; }
interface ScheduleItem { id: string; title: string; date: string; time: string; location: string; active: boolean; }
interface ProfileData { bio?: string; responsibilities?: string; education?: string; }
interface PostItem { id: string; title: string; content: string; images: string[]; created_at: { seconds: number, nanoseconds: number } | null; }

const AUTHORIZED_EMAILS = ["yeshwanthgunda98@gmail.com", "sghdas.rns@gmail.com"];

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<"courses" | "schedule" | "profile" | "posts">("posts");
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Data
    const [courses, setCourses] = useState<Course[]>([]);
    // const [events, setEvents] = useState<EventItem[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [profile, setProfile] = useState<ProfileData>({ bio: "", responsibilities: "", education: "" });

    // Post Form State
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postImages, setPostImages] = useState<File[]>([]);
    const [existingPostImages, setExistingPostImages] = useState<string[]>([]);

    // Other Form States
    const [courseTitle, setCourseTitle] = useState("");
    const [courseUrl, setCourseUrl] = useState("");
    // const [eventImage, setEventImage] = useState<File | null>(null);
    const [scheduleItem, setScheduleItem] = useState({ title: "", date: "", time: "", location: "" });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (currentUser.email && AUTHORIZED_EMAILS.includes(currentUser.email)) {
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    toast.error("Unauthorized Access Denied");
                    signOut(auth);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === "courses") {
                const snap = await getDocs(collection(db, "courses"));
                setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
                // } else if (activeTab === "events") {
                //     const snap = await getDocs(collection(db, "events"));
                //     setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
            } else if (activeTab === "schedule") {
                const snap = await getDocs(collection(db, "schedule"));
                setSchedule(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
            } else if (activeTab === "profile") {
                const docSnap = await getDocs(collection(db, "profile"));
                if (!docSnap.empty) setProfile(docSnap.docs[0].data() as ProfileData);
            } else if (activeTab === "posts") {
                const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
                const snap = await getDocs(q);
                setPosts(snap.docs.map(d => {
                    const data = d.data();
                    return { id: d.id, ...data, images: data.images || [] } as PostItem;
                }));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load data");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (!result.user.email || !AUTHORIZED_EMAILS.includes(result.user.email)) {
                await signOut(auth);
                toast.error("Access Denied: Email not authorized.");
            } else {
                toast.success("Welcome back!");
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Login Failed";
            toast.error(msg);
        }
    };

    const logout = async () => {
        await signOut(auth);
        toast.info("Logged out");
    };

    const resetForms = () => {
        setEditingId(null);
        setPostTitle(""); setPostContent(""); setPostImages([]); setExistingPostImages([]);
        setCourseTitle(""); setCourseUrl("");
        // setEventImage(null);
        setScheduleItem({ title: "", date: "", time: "", location: "" });
    };

    // Generic Delete with Sonner Promise
    const handleDelete = async (collectionName: string, id: string) => {
        toast.promise(
            async () => {
                await deleteDoc(doc(db, collectionName, id));
                await fetchData();
            },
            {
                loading: 'Deleting...',
                success: 'Item deleted',
                error: 'Failed to delete',
            }
        );
    };

    // EDIT HANDLERS
    const handleEditPost = (post: PostItem) => {
        setEditingId(post.id);
        setPostTitle(post.title);
        setPostContent(post.content);
        setExistingPostImages(post.images);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info("Editing Post: " + post.title);
    };

    const handleEditCourse = (course: Course) => {
        setEditingId(course.id);
        setCourseTitle(course.title);
        setCourseUrl(course.youtube_url);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEditSchedule = (item: ScheduleItem) => {
        setEditingId(item.id);
        setScheduleItem({ title: item.title, date: item.date, time: item.time, location: item.location });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    // SUBMIT HANDLERS
    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postTitle || !postContent) return;
        setSubmitting(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                // Upload new images
                const newImageUrls: string[] = [];
                if (postImages.length > 0) {
                    for (const file of postImages) {
                        const url = await uploadToCloudinary(file);
                        newImageUrls.push(url);
                    }
                }

                const finalImages = [...existingPostImages, ...newImageUrls];

                if (editingId) {
                    // Update
                    await updateDoc(doc(db, "posts", editingId), {
                        title: postTitle,
                        content: postContent,
                        images: finalImages,
                    });
                } else {
                    // Create
                    await addDoc(collection(db, "posts"), {
                        title: postTitle,
                        content: postContent,
                        images: finalImages,
                        created_at: serverTimestamp()
                    });
                }

                await fetchData();
                resetForms();
                resolve(true);
            } catch (err) {
                reject(err);
            } finally {
                setSubmitting(false);
            }
        });

        toast.promise(promise, {
            loading: editingId ? 'Updating post...' : 'Publishing post...',
            success: editingId ? 'Post updated!' : 'Post published!',
            error: 'Operation failed'
        });
    };

    const handleCourseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        toast.promise(
            async () => {
                if (editingId) {
                    await updateDoc(doc(db, "courses", editingId), { title: courseTitle, youtube_url: courseUrl });
                } else {
                    await addDoc(collection(db, "courses"), { title: courseTitle, youtube_url: courseUrl, created_at: serverTimestamp() });
                }
                await fetchData();
                resetForms();
            },
            {
                loading: 'Saving course...',
                success: 'Course saved!',
                error: 'Error saving course'
            }
        );
        setSubmitting(false);
    };

    /* const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventImage) return;
        setSubmitting(true);

        toast.promise(
            async () => {
                const url = await uploadToCloudinary(eventImage);
                await addDoc(collection(db, "events"), { image_url: url, created_at: serverTimestamp() });
                await fetchData();
                resetForms();
            },
            {
                loading: 'Uploading photo...',
                success: 'Photo added to gallery!',
                error: 'Upload failed'
            }
        );
        setSubmitting(false);
    }; */

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        toast.promise(
            async () => {
                if (editingId) {
                    await updateDoc(doc(db, "schedule", editingId), { ...scheduleItem });
                } else {
                    await addDoc(collection(db, "schedule"), { ...scheduleItem, active: true, created_at: serverTimestamp() });
                }
                await fetchData();
                resetForms();
            },
            {
                loading: 'Saving schedule...',
                success: 'Schedule updated!',
                error: 'Error saving schedule'
            }
        );
        setSubmitting(false);
    };

    const saveProfile = async () => {
        setSubmitting(true);
        toast.promise(
            async () => {
                await setDoc(doc(db, "profile", "main"), profile);
            },
            {
                loading: 'Saving profile...',
                success: 'Profile saved!',
                error: 'Failed to save'
            }
        );
        setSubmitting(false);
    };

    if (authLoading) return <div className="min-h-screen grid place-items-center bg-[#FDFBF7] text-primary"><Loader2 className="animate-spin w-8 h-8" /></div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100 text-center space-y-6 max-w-sm w-full">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-serif text-neutral-800">Admin Access</h1>
                        <p className="text-neutral-500 text-sm">Sign in with Authorized Email</p>
                    </div>
                    <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-neutral-700 font-medium py-3 px-4 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        <span>Sign in with Google</span>
                    </button>
                    <p className="text-xs text-neutral-400">Strictly for authorized administrators.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-neutral-800 p-4 md:p-8 font-sans">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                <div>
                    <h1 className="text-2xl font-serif text-primary">Dashboard</h1>
                    <p className="text-xs text-neutral-400">Logged in as: {user?.email}</p>
                </div>
                <button onClick={logout} className="text-sm text-neutral-500 hover:text-red-500 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </header>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-2 shrink-0">
                    <button onClick={() => { setActiveTab("posts"); resetForms(); }} className={cn("w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors font-medium", activeTab === "posts" ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-white hover:bg-orange-50 text-neutral-600")}>
                        <MessageSquarePlus className="w-5 h-5" /> Updates / Posts
                    </button>
                    <button onClick={() => { setActiveTab("courses"); resetForms(); }} className={cn("w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors font-medium", activeTab === "courses" ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-white hover:bg-orange-50 text-neutral-600")}>
                        <Video className="w-5 h-5" /> Video Courses
                    </button>
                    {/* <button onClick={() => { setActiveTab("events"); resetForms(); }} className={cn("w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors font-medium", activeTab === "events" ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-white hover:bg-orange-50 text-neutral-600")}>
                        <ImageIcon className="w-5 h-5" /> Photo Gallery
                    </button> */}
                    <button onClick={() => { setActiveTab("schedule"); resetForms(); }} className={cn("w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors font-medium", activeTab === "schedule" ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-white hover:bg-orange-50 text-neutral-600")}>
                        <Calendar className="w-5 h-5" /> Schedule
                    </button>
                    <button onClick={() => { setActiveTab("profile"); resetForms(); }} className={cn("w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors font-medium", activeTab === "profile" ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-white hover:bg-orange-50 text-neutral-600")}>
                        <UserIcon className="w-5 h-5" /> Profile Text
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-white border border-orange-100 shadow-sm rounded-2xl p-6 min-h-[600px]">

                    {/* POSTS TAB */}
                    {activeTab === "posts" && (
                        <div className="space-y-8">
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 relative">
                                {editingId && <button onClick={resetForms} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>}
                                <h2 className="text-lg font-serif text-primary mb-4">{editingId ? "Edit Update" : "New Update"}</h2>
                                <form onSubmit={handlePostSubmit} className="space-y-4">
                                    <input required placeholder="Title (e.g. Sunday Love Feast Report)" className="w-full p-3 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-primary/50" value={postTitle} onChange={e => setPostTitle(e.target.value)} />
                                    <textarea required placeholder="Write your update here (Max 200 words)..." className="w-full p-3 rounded-lg border border-orange-200 h-32 focus:outline-none focus:ring-2 focus:ring-primary/50" value={postContent} onChange={e => setPostContent(e.target.value)} />

                                    {/* Existing Images */}
                                    {existingPostImages.length > 0 && (
                                        <div className="flex gap-2">
                                            {existingPostImages.map((img, i) => (
                                                <div key={i} className="relative group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={img} alt="" className="w-16 h-16 rounded object-cover" />
                                                    <button type="button" onClick={() => setExistingPostImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-500 block">Add Photos</label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={e => setPostImages(Array.from(e.target.files || []))}
                                            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        />
                                    </div>

                                    <button disabled={submitting} className="bg-primary text-white px-8 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                                        {submitting ? "Saving..." : (editingId ? "Update Post" : "Post Update")}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium text-neutral-400 uppercase tracking-widest text-sm">Recent Posts</h3>
                                {posts.map(post => (
                                    <div key={post.id} className="border border-neutral-100 rounded-xl p-6 flex gap-6 hover:shadow-md transition-shadow group">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-lg">{post.title}</h4>
                                                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditPost(post)} className="text-blue-400 hover:text-blue-500 p-2"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete("posts", post.id)} className="text-red-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <p className="text-neutral-600 text-sm line-clamp-3">{post.content}</p>
                                            {post.images && post.images.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {post.images.map((img, i) => (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover bg-neutral-100" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COURSES TAB */}
                    {activeTab === "courses" && (
                        <div className="space-y-6">
                            <form onSubmit={handleCourseSubmit} className="flex flex-col md:flex-row gap-4 bg-neutral-50 p-4 rounded-xl relative">
                                {editingId && <button onClick={resetForms} type="button" className="absolute -top-2 -right-2 bg-neutral-200 rounded-full p-1"><X className="w-4 h-4" /></button>}
                                <input required placeholder="Title" className="flex-1 border p-2 rounded" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
                                <input required placeholder="YouTube URL" className="flex-1 border p-2 rounded" value={courseUrl} onChange={e => setCourseUrl(e.target.value)} />
                                <button disabled={submitting} className="bg-primary text-white px-6 py-2 rounded font-medium disabled:opacity-50">{editingId ? "Update" : "Add"}</button>
                            </form>
                            <div className="grid gap-3">
                                {courses.map(course => (
                                    <div key={course.id} className="flex justify-between items-center bg-white p-3 rounded border hover:shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={getYouTubeThumbnail(course.youtube_url)} alt="" className="w-20 h-12 object-cover rounded" />
                                            <h3 className="font-medium">{course.title}</h3>
                                        </div>
                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100">
                                            <button onClick={() => handleEditCourse(course)} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete("courses", course.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* {activeTab === "events" && (
                        <div className="space-y-6">
                            <form onSubmit={handleEventSubmit} className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-primary cursor-pointer relative bg-neutral-50/50">
                                <input type="file" required accept="image/*" onChange={e => setEventImage(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="pointer-events-none">
                                    {eventImage ? <span className="text-primary font-medium">{eventImage.name} (Click Add to upload)</span> : <span className="text-neutral-400">Click to Select Image</span>}
                                </div>
                            </form>
                            {eventImage && <button onClick={handleEventSubmit} disabled={submitting} className="w-full bg-primary text-white py-2 rounded font-medium">Upload Selected</button>}

                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                {events.map(event => (
                                    <div key={event.id} className="relative group">
                                        <img src={event.image_url} alt="" className="w-full aspect-square object-cover rounded-lg shadow-sm" />
                                        <button onClick={() => handleDelete("events", event.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )} */}

                    {activeTab === "schedule" && (
                        <div className="space-y-6">
                            <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 gap-4 bg-neutral-50 p-6 rounded-xl relative">
                                {editingId && <button onClick={resetForms} type="button" className="absolute top-2 right-2 bg-neutral-200 rounded-full p-1"><X className="w-4 h-4" /></button>}
                                <input required placeholder="Event Title" className="border p-2 rounded" value={scheduleItem.title} onChange={e => setScheduleItem({ ...scheduleItem, title: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input required placeholder="Date (Sat, Oct 12)" className="border p-2 rounded" value={scheduleItem.date} onChange={e => setScheduleItem({ ...scheduleItem, date: e.target.value })} />
                                    <input required placeholder="Time (6:00 PM)" className="border p-2 rounded" value={scheduleItem.time} onChange={e => setScheduleItem({ ...scheduleItem, time: e.target.value })} />
                                </div>
                                <input required placeholder="Location" className="border p-2 rounded" value={scheduleItem.location} onChange={e => setScheduleItem({ ...scheduleItem, location: e.target.value })} />
                                <button disabled={submitting} className="bg-primary text-white py-2 rounded font-medium disabled:opacity-50">{editingId ? "Update Class" : "Add Class"}</button>
                            </form>

                            <div className="space-y-3">
                                {schedule.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded border hover:shadow-sm group">
                                        <div>
                                            <h3 className="font-semibold text-primary">{item.title}</h3>
                                            <p className="text-sm text-neutral-500">{item.date} • {item.time} • {item.location}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100">
                                            <button onClick={() => handleEditSchedule(item)} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete("schedule", item.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <textarea className="w-full h-32 border p-3 rounded" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio..." />
                            <textarea className="w-full h-32 border p-3 rounded" value={profile.responsibilities} onChange={e => setProfile({ ...profile, responsibilities: e.target.value })} placeholder="Responsibilities..." />
                            <textarea className="w-full h-32 border p-3 rounded" value={profile.education} onChange={e => setProfile({ ...profile, education: e.target.value })} placeholder="Education..." />
                            <button onClick={saveProfile} disabled={submitting} className="bg-primary text-white px-6 py-2 rounded font-medium disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" /> Save Profile</button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
