"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_BLOGS, BlogItem } from "@/lib/blogs";
import { Footer } from "@/components/footer";
import { ArrowLeft, Share2, BookOpen, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function BlogArticlePage() {
  const params = useParams();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      if (!blogId) return;

      try {
        // Try fetching from Firestore first
        const docRef = doc(db, "blogs", blogId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog({ id: docSnap.id, ...docSnap.data() } as BlogItem);
        } else {
          // Fallback to local DEFAULT_BLOGS if matching
          const defaultMatch = DEFAULT_BLOGS.find((b) => b.id === blogId);
          if (defaultMatch) {
            setBlog(defaultMatch);
          } else {
            console.warn("Blog not found in Firestore or default list");
          }
        }
      } catch (err) {
        console.error("Error loading blog article:", err);
        // Fallback on network/firestore error
        const defaultMatch = DEFAULT_BLOGS.find((b) => b.id === blogId);
        if (defaultMatch) setBlog(defaultMatch);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [blogId]);

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
          The blog article you are looking for may have been moved or updated.
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

  // Format paragraphs
  const paragraphs = blog.content
    ? blog.content.split("\n\n").map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-neutral-800 selection:bg-secondary selection:text-black">
      {/* Hero / Header Container */}
      <article className="pt-8 md:pt-12 pb-20 px-4 md:px-6 max-w-4xl mx-auto space-y-10">
        {/* Top Navigation (Scrolls naturally with page) */}
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

        {/* Featured Cover Image - Shows full image without cropping */}
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

                  // Individual blockquote line
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

                  // Bullet list item
                  if (trimmed.startsWith("- ")) {
                    return (
                      <div key={lineIdx} className="flex items-start gap-3 ml-2 my-2">
                        <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                        <p className="flex-1">{trimmed.replace("- ", "")}</p>
                      </div>
                    );
                  }

                  // Numbered list item
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

                  // Standard paragraph text
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
