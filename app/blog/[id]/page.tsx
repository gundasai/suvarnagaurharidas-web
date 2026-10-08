"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc, query, where, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogItem, BlogComment } from "@/lib/blogs";
import { Footer } from "@/components/footer";
import { ArrowLeft, Share2, BookOpen, ExternalLink, MessageCircle, Send, User, Mail, ShieldCheck, ThumbsUp, ThumbsDown, Heart, Reply, CornerDownRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BlogArticlePage() {
  const params = useParams();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // User Reactions (stored per comment in local storage)
  const [userReactions, setUserReactions] = useState<Record<string, "likes" | "dislikes" | "loves" | null>>({});

  useEffect(() => {
    // Load local storage reactions on mount
    if (typeof window !== "undefined") {
      const stored: Record<string, "likes" | "dislikes" | "loves" | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sghdas_reaction_")) {
          const commentId = key.replace("sghdas_reaction_", "");
          const val = localStorage.getItem(key) as "likes" | "dislikes" | "loves" | null;
          if (val) stored[commentId] = val;
        }
      }
      setUserReactions(stored);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    if (!blogId) return;
    try {
      const q = query(collection(db, "blog_comments"), where("blog_id", "==", blogId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogComment));
      list.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
      setComments(list);
    } catch (err) {
      console.error("Error loading blog comments:", err);
    }
  }, [blogId]);

  useEffect(() => {
    async function loadArticle() {
      if (!blogId) return;

      try {
        const docRef = doc(db, "blogs", blogId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog({ id: docSnap.id, ...docSnap.data() } as BlogItem);
        } else {
          setBlog(null);
        }
      } catch (err) {
        console.error("Error loading blog article:", err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
    fetchComments();
  }, [blogId, fetchComments]);

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.summary || blog.title,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied to clipboard!");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      toast.error("Please fill in your name, email, and comment.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(commentEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, "blog_comments"), {
        blog_id: blogId,
        blog_title: blog?.title || "",
        parent_id: null,
        name: commentName.trim(),
        email: commentEmail.trim(), // Stored securely for admin moderation only
        comment: commentText.trim(),
        likes: 0,
        dislikes: 0,
        loves: 0,
        created_at: serverTimestamp(),
      });

      setCommentName("");
      setCommentEmail("");
      setCommentText("");
      toast.success("Thank you! Your reflection has been shared.");
      await fetchComments();
    } catch (err) {
      console.error("Error submitting comment:", err);
      toast.error("Failed to submit comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentComment: BlogComment) => {
    e.preventDefault();
    if (!replyName.trim() || !replyEmail.trim() || !replyText.trim()) {
      toast.error("Please fill in your name, email, and reply.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(replyEmail.trim())) {
      toast.error("Please provide a valid email address.");
      return;
    }

    setSubmittingReply(true);
    try {
      await addDoc(collection(db, "blog_comments"), {
        blog_id: blogId,
        blog_title: blog?.title || "",
        parent_id: parentComment.id,
        parent_author: parentComment.name,
        name: replyName.trim(),
        email: replyEmail.trim(), // Stored securely for admin moderation only
        comment: replyText.trim(),
        likes: 0,
        dislikes: 0,
        loves: 0,
        created_at: serverTimestamp(),
      });

      setReplyName("");
      setReplyEmail("");
      setReplyText("");
      setReplyingToId(null);
      toast.success("Your reply has been posted!");
      await fetchComments();
    } catch (err) {
      console.error("Error submitting reply:", err);
      toast.error("Failed to post reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReaction = async (commentId: string, type: "likes" | "dislikes" | "loves") => {
    const storageKey = `sghdas_reaction_${commentId}`;
    const currentReaction = userReactions[commentId];

    const isRemoving = currentReaction === type;
    const newReaction = isRemoving ? null : type;

    // Update local user reaction state
    setUserReactions((prev) => ({ ...prev, [commentId]: newReaction }));
    if (typeof window !== "undefined") {
      if (newReaction) {
        localStorage.setItem(storageKey, newReaction);
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    // Optimistically update comment counts in UI
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const currentCount = c[type] || 0;
        const updated = { ...c };
        if (isRemoving) {
          updated[type] = Math.max(0, currentCount - 1);
        } else {
          updated[type] = currentCount + 1;
          if (currentReaction && currentReaction !== type) {
            const prevTypeCount = c[currentReaction] || 0;
            updated[currentReaction] = Math.max(0, prevTypeCount - 1);
          }
        }
        return updated;
      })
    );

    try {
      const docRef = doc(db, "blog_comments", commentId);
      if (isRemoving) {
        await updateDoc(docRef, { [type]: increment(-1) });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = { [type]: increment(1) };
        if (currentReaction && currentReaction !== type) {
          updates[currentReaction] = increment(-1);
        }
        await updateDoc(docRef, updates);
      }
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  };

  // Group comments into root comments and replies
  const { rootComments, repliesMap } = useMemo(() => {
    const roots: BlogComment[] = [];
    const map: Record<string, BlogComment[]> = {};

    comments.forEach((c) => {
      if (c.parent_id) {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      } else {
        roots.push(c);
      }
    });

    // Sort replies chronologically (earliest to latest)
    Object.keys(map).forEach((pid) => {
      map[pid].sort((a, b) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0));
    });

    return { rootComments: roots, repliesMap: map };
  }, [comments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-neutral-500 font-serif">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-serif text-neutral-800 mb-4">Article Not Found</h1>
        <p className="text-neutral-600 mb-8 max-w-md">
          The blog article you are looking for may have been moved or removed.
        </p>
        <Link
          href="/#blogs"
          className="bg-primary text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blogs
        </Link>
      </div>
    );
  }

  // Check whether content is rich HTML or legacy plain text
  const isHtml = blog.content ? /<[a-z][\s\S]*>/i.test(blog.content) : false;

  // Format paragraphs for legacy plain-text articles
  const paragraphs = (!isHtml && blog.content)
    ? blog.content.split("\n\n").map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-neutral-800 selection:bg-secondary selection:text-black">
      {/* Hero / Header Container */}
      <article className="pt-8 md:pt-12 pb-20 px-4 md:px-6 max-w-4xl mx-auto space-y-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-orange-100/60 pb-6">
          <Link
            href="/#blogs"
            className="bg-white border border-neutral-200/80 shadow-xs rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:text-primary hover:border-orange-300 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> All Blogs
          </Link>

          <a
            href="https://gita-wisdom.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-50/90 border border-orange-200/80 shadow-xs rounded-full px-5 py-2.5 text-sm font-semibold text-primary hover:bg-orange-100 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-primary" /> Gita Wisdom Course
          </a>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-orange-100 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Wisdom Article
            </span>
            <span className="text-xs text-neutral-400">5 min read</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-neutral-800 leading-[1.15]">
            {blog.title}
          </h1>

          {/* Author metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-orange-100/80 py-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-orange-100">
                <Image
                  src="/monk-profile.png"
                  alt={blog.author || "Suvarna Gaura Hari Das"}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h2 className="font-bold text-neutral-800 text-sm md:text-base">
                  {blog.author || "Suvarna Gaura Hari Das"}
                </h2>
                <p className="text-xs text-neutral-500">Monk • Educator • Life Coach</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="bg-white hover:bg-orange-50 border border-neutral-200 text-neutral-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Article
              </button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-md border border-neutral-200/70 bg-orange-50/40 flex justify-center items-center p-1 md:p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blog.image || "/monk-profile.png"}
            alt={blog.title}
            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
          />
        </div>

        {/* Summary Callout Box */}
        {blog.summary && (
          <div className="bg-orange-50/80 border-l-4 border-primary p-6 md:p-8 rounded-r-2xl text-neutral-700 italic font-serif text-lg md:text-xl leading-relaxed shadow-sm">
            &quot;{blog.summary}&quot;
          </div>
        )}

        {/* Article Body Content */}
        {isHtml ? (
          <div
            className="blog-rich-content text-neutral-800 text-base md:text-lg leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        ) : (
          <div className="space-y-8 text-neutral-800 text-base md:text-lg leading-relaxed font-sans">
            {paragraphs.map((paragraph, idx) => {
              const lines = paragraph.split("\n");
              const isBlockquote = lines.every((line) => line.trim().startsWith(">") || line.trim() === "");

              if (isBlockquote) {
                const quoteContent = lines
                  .map((l) => l.trim().replace(/^>\s*/, ""))
                  .filter((l) => l.length > 0);

                return (
                  <blockquote
                    key={idx}
                    className="border-l-4 border-neutral-600 bg-neutral-50/60 pl-5 md:pl-6 py-3 my-6 rounded-r-xl space-y-2 text-neutral-800 font-serif leading-relaxed shadow-xs"
                  >
                    {quoteContent.map((qLine, qIdx) => (
                      <p
                        key={qIdx}
                        className={
                          qLine.startsWith('"') || qLine.startsWith('“')
                            ? "italic text-neutral-600 text-base md:text-lg"
                            : "font-medium text-neutral-800 text-base md:text-lg"
                        }
                      >
                        {qLine}
                      </p>
                    ))}
                  </blockquote>
                );
              }

              return (
                <div key={idx} className="space-y-3">
                  {lines.map((line, lineIdx) => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith(">")) {
                      const quoteText = trimmed.replace(/^>\s*/, "");
                      return (
                        <blockquote
                          key={lineIdx}
                          className="border-l-4 border-neutral-600 bg-neutral-50/60 pl-5 pr-4 py-2.5 my-3 rounded-r-lg text-neutral-800 font-serif leading-relaxed"
                        >
                          <p className={quoteText.startsWith('"') || quoteText.startsWith('“') ? "italic text-neutral-600" : "font-medium text-neutral-800"}>
                            {quoteText}
                          </p>
                        </blockquote>
                      );
                    }

                    if (trimmed.startsWith("- ")) {
                      return (
                        <div key={lineIdx} className="flex items-start gap-3 ml-2 my-2">
                          <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                          <p className="flex-1">{trimmed.replace("- ", "")}</p>
                        </div>
                      );
                    }

                    if (trimmed.match(/^\d+\.\s/)) {
                      return (
                        <div key={lineIdx} className="flex items-start gap-3 ml-2 my-2">
                          <span className="font-bold text-primary shrink-0">
                            {trimmed.match(/^\d+\./)?.[0]}
                          </span>
                          <p className="flex-1">{trimmed.replace(/^\d+\.\s/, "")}</p>
                        </div>
                      );
                    }

                    return (
                      <p key={lineIdx} className="whitespace-pre-wrap leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* COMMENTS & REFLECTIONS SECTION */}
        <section id="comments-section" className="pt-12 mt-16 border-t border-orange-100 space-y-10">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-800 flex items-center gap-2.5">
                <MessageCircle className="w-6 h-6 text-primary" /> Reflections & Comments
              </h2>
              <p className="text-sm text-neutral-500">
                Share your spiritual realizations, insights, or questions below.
              </p>
            </div>
            <span className="bg-orange-100 text-primary font-bold text-xs px-3.5 py-1.5 rounded-full shrink-0">
              {comments.length} {comments.length === 1 ? "Reflection" : "Reflections"}
            </span>
          </div>

          {/* Comment Submission Form */}
          <div className="bg-white rounded-3xl border border-orange-200/80 p-6 md:p-8 shadow-sm space-y-5">
            <h3 className="font-serif font-semibold text-lg text-neutral-800">
              Leave a Reflection
            </h3>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm bg-neutral-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> Mail ID *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm bg-neutral-50/50"
                  />
                  <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Private — your email will never be shown publicly.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block">
                  Your Reflection / Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your reflection, thoughts, or questions regarding this wisdom teaching..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm bg-neutral-50/50 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComment}
                className="bg-primary hover:bg-orange-600 text-white font-medium px-7 py-3 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submittingComment ? "Sharing Reflection..." : "Post Reflection"}
              </button>
            </form>
          </div>

          {/* List of Published Comments */}
          <div className="space-y-6">
            {rootComments.length === 0 ? (
              <div className="text-center py-12 bg-white/70 rounded-3xl border border-dashed border-orange-200 p-8 space-y-2">
                <MessageCircle className="w-8 h-8 text-orange-300 mx-auto" />
                <p className="text-neutral-600 font-serif text-base">
                  No reflections shared yet.
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Be the first to share your thoughts, questions, or inspirations on this article!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {rootComments.map((c) => {
                  const commentReplies = repliesMap[c.id] || [];
                  const activeReaction = userReactions[c.id];

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-3xl border border-neutral-200/80 p-5 md:p-6 shadow-xs space-y-4 transition-all hover:shadow-sm"
                    >
                      {/* Top Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          {/* ONLY Name and Date are rendered publicly - NO email is exposed */}
                          <h4 className="font-bold text-neutral-800 text-sm md:text-base">
                            {c.name}
                          </h4>
                          {c.created_at?.seconds ? (
                            <p className="text-xs text-neutral-400">
                              {new Date(c.created_at.seconds * 1000).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-400">Recent</p>
                          )}
                        </div>
                      </div>

                      {/* Comment Message */}
                      <div className="text-neutral-700 text-sm md:text-base leading-relaxed pl-0 md:pl-13">
                        {c.comment}
                      </div>

                      {/* Interactive Action Bar: Like, Dislike, Love, Reply */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 pl-0 md:pl-13">
                        {/* LIKE */}
                        <button
                          type="button"
                          onClick={() => handleReaction(c.id, "likes")}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95",
                            activeReaction === "likes"
                              ? "bg-orange-100 text-primary shadow-xs border border-orange-200"
                              : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70"
                          )}
                          title="Like this reflection"
                        >
                          <ThumbsUp className={cn("w-3.5 h-3.5", activeReaction === "likes" && "fill-primary")} />
                          <span>{c.likes || 0}</span>
                        </button>

                        {/* DISLIKE */}
                        <button
                          type="button"
                          onClick={() => handleReaction(c.id, "dislikes")}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95",
                            activeReaction === "dislikes"
                              ? "bg-neutral-200 text-neutral-800 shadow-xs border border-neutral-300"
                              : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70"
                          )}
                          title="Dislike"
                        >
                          <ThumbsDown className={cn("w-3.5 h-3.5", activeReaction === "dislikes" && "fill-neutral-700")} />
                          <span>{c.dislikes || 0}</span>
                        </button>

                        {/* LOVE */}
                        <button
                          type="button"
                          onClick={() => handleReaction(c.id, "loves")}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95",
                            activeReaction === "loves"
                              ? "bg-rose-50 text-rose-600 shadow-xs border border-rose-200"
                              : "bg-neutral-100/80 text-neutral-600 hover:bg-rose-50 hover:text-rose-500"
                          )}
                          title="Love this reflection"
                        >
                          <Heart className={cn("w-3.5 h-3.5", activeReaction === "loves" ? "fill-rose-500 text-rose-500" : "")} />
                          <span>{c.loves || 0}</span>
                        </button>

                        {/* REPLY */}
                        <button
                          type="button"
                          onClick={() => {
                            if (replyingToId === c.id) {
                              setReplyingToId(null);
                            } else {
                              setReplyingToId(c.id);
                              setReplyName("");
                              setReplyEmail("");
                              setReplyText("");
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 ml-auto",
                            replyingToId === c.id
                              ? "bg-orange-100 text-primary border border-orange-200"
                              : "bg-neutral-100/80 text-neutral-600 hover:bg-orange-50 hover:text-primary"
                          )}
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* INLINE REPLY FORM */}
                      {replyingToId === c.id && (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, c)}
                          className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 md:p-5 mt-3 space-y-3 pl-0 md:ml-13 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5" /> Replying to @{c.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="text-xs text-neutral-400 hover:text-neutral-600"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required
                              placeholder="Your Name *"
                              value={replyName}
                              onChange={(e) => setReplyName(e.target.value)}
                              className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <div>
                              <input
                                type="email"
                                required
                                placeholder="Your Mail ID * (Private)"
                                value={replyEmail}
                                onChange={(e) => setReplyEmail(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <p className="text-[10px] text-neutral-400 mt-0.5">🔒 Mail ID is private</p>
                            </div>
                          </div>

                          <textarea
                            required
                            rows={2}
                            placeholder={`Write your reply to ${c.name}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full p-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="px-4 py-1.5 rounded-full text-xs text-neutral-600 hover:bg-neutral-200/50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingReply}
                              className="bg-primary hover:bg-orange-600 text-white font-medium px-5 py-1.5 rounded-full text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              {submittingReply ? "Posting..." : "Post Reply"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* NESTED REPLIES LIST */}
                      {commentReplies.length > 0 && (
                        <div className="ml-2 md:ml-12 border-l-2 border-orange-200/80 pl-3 md:pl-5 space-y-3 mt-4">
                          {commentReplies.map((reply) => {
                            const activeReplyReaction = userReactions[reply.id];

                            return (
                              <div
                                key={reply.id}
                                className="bg-orange-50/40 rounded-2xl border border-orange-100 p-4 space-y-2.5"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                    {reply.name ? reply.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h5 className="font-bold text-neutral-800 text-xs md:text-sm">
                                        {reply.name}
                                      </h5>
                                      <span className="text-[10px] text-primary bg-orange-100/90 px-2 py-0.5 rounded-full font-medium">
                                        replying to @{c.name}
                                      </span>
                                    </div>
                                    {reply.created_at?.seconds ? (
                                      <p className="text-[11px] text-neutral-400">
                                        {new Date(reply.created_at.seconds * 1000).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                    ) : (
                                      <p className="text-[11px] text-neutral-400">Recent</p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-neutral-700 text-xs md:text-sm leading-relaxed pl-0 md:pl-10.5">
                                  {reply.comment}
                                </div>

                                {/* Reactions on Reply */}
                                <div className="flex items-center gap-2 pt-1 pl-0 md:pl-10.5">
                                  <button
                                    type="button"
                                    onClick={() => handleReaction(reply.id, "likes")}
                                    className={cn(
                                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95",
                                      activeReplyReaction === "likes"
                                        ? "bg-orange-100 text-primary shadow-xs border border-orange-200"
                                        : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                                    )}
                                    title="Like"
                                  >
                                    <ThumbsUp className={cn("w-3 h-3", activeReplyReaction === "likes" && "fill-primary")} />
                                    <span>{reply.likes || 0}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReaction(reply.id, "dislikes")}
                                    className={cn(
                                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95",
                                      activeReplyReaction === "dislikes"
                                        ? "bg-neutral-200 text-neutral-800 shadow-xs border border-neutral-300"
                                        : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                                    )}
                                    title="Dislike"
                                  >
                                    <ThumbsDown className={cn("w-3 h-3", activeReplyReaction === "dislikes" && "fill-neutral-700")} />
                                    <span>{reply.dislikes || 0}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReaction(reply.id, "loves")}
                                    className={cn(
                                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95",
                                      activeReplyReaction === "loves"
                                        ? "bg-rose-50 text-rose-600 shadow-xs border border-rose-200"
                                        : "bg-white text-neutral-600 hover:bg-rose-50 hover:text-rose-500 border border-neutral-200/60"
                                    )}
                                    title="Love"
                                  >
                                    <Heart className={cn("w-3 h-3", activeReplyReaction === "loves" && "fill-rose-500 text-rose-500")} />
                                    <span>{reply.loves || 0}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Bottom Banner & Next Actions */}
        <div className="mt-16 pt-12 border-t border-orange-100">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-sm">
            <h3 className="text-2xl md:text-3xl font-serif text-neutral-800 font-bold">
              Deepen Your Spiritual Journey
            </h3>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm md:text-base">
              Take the next step in self-mastery and wisdom with our specialized online course, Gita Wisdom.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="https://gita-wisdom.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
              >
                Explore Gita Wisdom Course <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href="/#blogs"
                className="bg-white text-neutral-800 border border-neutral-200 px-8 py-3 rounded-full font-medium hover:bg-neutral-50 transition-colors inline-flex items-center gap-2"
              >
                Explore More Blogs
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
