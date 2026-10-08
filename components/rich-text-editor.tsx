"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { useEffect, useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Link2,
  Unlink,
  Undo,
  Redo,
  Highlighter,
  Palette,
  Type
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  { label: "Deep Charcoal", color: "#1F2937" },
  { label: "Sacred Saffron", color: "#F46016" },
  { label: "Temple Gold", color: "#D97706" },
  { label: "Spiritual Maroon", color: "#991B1B" },
  { label: "Forest Green", color: "#166534" },
  { label: "Mystic Indigo", color: "#4338CA" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", color: "" },
  { label: "Saffron Glow", color: "#FFEDD5" },
  { label: "Golden Amber", color: "#FEF3C7" },
  { label: "Peaceful Mint", color: "#DCFCE7" },
  { label: "Serene Sky", color: "#E0F2FE" },
  { label: "Lotus Purple", color: "#F3E8FF" },
];

interface FontGroup {
  group: string;
  fonts: { label: string; value: string }[];
}

const FONT_GROUPS: FontGroup[] = [
  {
    group: "Vedic & Classical Serifs",
    fonts: [
      { label: "Cinzel (Classical Vedic)", value: "'Cinzel', serif" },
      { label: "Playfair Display (Royal Serif)", value: "'Playfair Display', serif" },
      { label: "Merriweather (Wisdom Book)", value: "'Merriweather', serif" },
      { label: "Lora (Elegant Calligraphic)", value: "'Lora', serif" },
      { label: "Cormorant Garamond (Majestic)", value: "'Cormorant Garamond', serif" },
      { label: "EB Garamond (Traditional Literature)", value: "'EB Garamond', serif" },
      { label: "Crimson Text (Spiritual Reading)", value: "'Crimson Text', serif" },
      { label: "Prata (Ornate Classical)", value: "'Prata', serif" },
      { label: "Bodoni Moda (High Contrast Luxury)", value: "'Bodoni Moda', serif" },
      { label: "Marcellus (Roman Inscription)", value: "'Marcellus', serif" },
      { label: "Spectral (Literary Edition)", value: "'Spectral', serif" },
      { label: "Alegreya (Vedic Scholar)", value: "'Alegreya', serif" },
    ],
  },
  {
    group: "Modern & Clean Sans",
    fonts: [
      { label: "Inter (Modern Minimalist)", value: "'Inter', sans-serif" },
      { label: "Outfit (Contemporary Aesthetic)", value: "'Outfit', sans-serif" },
      { label: "Plus Jakarta Sans (Crisp Clean)", value: "'Plus Jakarta Sans', sans-serif" },
      { label: "Poppins (Friendly Geometric)", value: "'Poppins', sans-serif" },
      { label: "Montserrat (Architectural Bold)", value: "'Montserrat', sans-serif" },
      { label: "Raleway (Refined Elegance)", value: "'Raleway', sans-serif" },
      { label: "Open Sans (Warm & Readable)", value: "'Open Sans', sans-serif" },
      { label: "DM Sans (Modern Harmony)", value: "'DM Sans', sans-serif" },
      { label: "Work Sans (Clean Editorial)", value: "'Work Sans', sans-serif" },
      { label: "Quicksand (Gentle & Calm)", value: "'Quicksand', sans-serif" },
      { label: "Nunito (Soft & Balanced)", value: "'Nunito', sans-serif" },
      { label: "Cabin (Humanist Sans)", value: "'Cabin', sans-serif" },
      { label: "Josefin Sans (Vintage Modern)", value: "'Josefin Sans', sans-serif" },
    ],
  },
  {
    group: "Spiritual Scripts & Cursives",
    fonts: [
      { label: "Caveat (Spiritual Script)", value: "'Caveat', cursive" },
      { label: "Dancing Script (Fluid Cursive)", value: "'Dancing Script', cursive" },
      { label: "Great Vibes (Calligraphic Flourish)", value: "'Great Vibes', cursive" },
      { label: "Alex Brush (Graceful Classic)", value: "'Alex Brush', cursive" },
      { label: "Sacramento (Connected Script)", value: "'Sacramento', cursive" },
      { label: "Satisfy (Expressive Brush)", value: "'Satisfy', cursive" },
      { label: "Parisienne (French Elegance)", value: "'Parisienne', cursive" },
      { label: "Kaushan Script (Natural Calligraphy)", value: "'Kaushan Script', cursive" },
      { label: "Pacifico (Relaxed Flow)", value: "'Pacifico', cursive" },
      { label: "Marck Script (Intimate Handwriting)", value: "'Marck Script', cursive" },
    ],
  },
  {
    group: "Display & Monospace",
    fonts: [
      { label: "Cinzel Decorative (Ornate Ceremonial)", value: "'Cinzel Decorative', cursive" },
      { label: "Oswald (Bold Impactful Title)", value: "'Oswald', sans-serif" },
      { label: "Bebas Neue (Punchy Header)", value: "'Bebas Neue', sans-serif" },
      { label: "Abril Fatface (Heavy Display Serif)", value: "'Abril Fatface', cursive" },
      { label: "Fira Code (Code / Sacred Verses)", value: "'Fira Code', monospace" },
      { label: "Courier Prime (Vintage Typewriter)", value: "'Courier Prime', monospace" },
      { label: "Space Mono (Editorial Monospace)", value: "'Space Mono', monospace" },
    ],
  },
];

export function RichTextEditor({ value, onChange, placeholder = "Write full article here..." }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[300px] text-neutral-800",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      const html = editor.getHTML();
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize when value is updated externally (e.g. edit mode loaded or form reset)
  useEffect(() => {
    if (!editor || isUpdatingRef.current) return;
    const currentHTML = editor.getHTML();
    if (value !== currentHTML) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div className="w-full border border-orange-200 rounded-xl bg-orange-50/30 p-8 text-center animate-pulse">
        <p className="text-sm font-medium text-neutral-400">Loading Rich Text Editor...</p>
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter destination URL:", previousUrl);

    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const currentFont = editor.getAttributes("textStyle").fontFamily || "'Inter', sans-serif";

  return (
    <div className="border border-orange-200/90 rounded-2xl bg-white shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
      {/* TOOLBAR */}
      <div className="bg-orange-50/70 border-b border-orange-100 p-2 md:p-3 flex flex-wrap items-center gap-1.5 select-none text-neutral-700">
        {/* FONT SELECTOR */}
        <div className="relative inline-flex items-center mr-1">
          <Type className="w-4 h-4 text-neutral-500 absolute left-2 pointer-events-none" />
          <select
            value={currentFont}
            onChange={(e) => {
              if (e.target.value === "'Inter', sans-serif") {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(e.target.value).run();
              }
            }}
            className="pl-7 pr-3 py-1.5 text-xs font-medium rounded-lg border border-orange-200 bg-white text-neutral-700 hover:border-orange-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs max-w-[200px] truncate"
            title="Font Family"
          >
            {FONT_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.fonts.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* HEADINGS & PARAGRAPH */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
            editor.isActive("paragraph") && !editor.isActive("heading")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Paragraph / Normal Text"
        >
          ¶ Text
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Heading 1 (Main Section Title)"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Heading 2 (Sub-section Title)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Heading 3 (Minor Topic)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        {/* INLINE STYLES */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("bold")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("italic")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("underline")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("strike")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        {/* COLOR & HIGHLIGHT */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="p-1.5 rounded-md hover:bg-orange-100/70 text-neutral-600 flex items-center gap-1"
            title="Text Color"
          >
            <Palette className="w-4 h-4 text-primary" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-orange-200 rounded-xl shadow-lg p-2.5 w-48 space-y-2 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                Sacred Colors
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c.color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-neutral-200 hover:scale-110 transition-transform shadow-2xs"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                <label className="text-xs text-neutral-500 font-medium">Custom:</label>
                <input
                  type="color"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  className="w-6 h-6 rounded border cursor-pointer"
                  title="Pick Custom Color"
                />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="text-[10px] ml-auto text-neutral-500 hover:text-red-500"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text Highlight Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="p-1.5 rounded-md hover:bg-orange-100/70 text-neutral-600 flex items-center gap-1"
            title="Highlight Color"
          >
            <Highlighter className="w-4 h-4 text-amber-600" />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-orange-200 rounded-xl shadow-lg p-2.5 w-48 space-y-2 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                Background Highlights
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => {
                      if (!h.color) {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().setHighlight({ color: h.color }).run();
                      }
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-neutral-200 hover:scale-110 transition-transform shadow-2xs relative flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: h.color || "#FFFFFF" }}
                    title={h.label}
                  >
                    {!h.color && "✕"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ALIGNMENT */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        {/* LISTS & QUOTES */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("bulletList")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("orderedList")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("blockquote")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Blockquote (Vedic Verse / Quote)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-md hover:bg-orange-100/70 text-neutral-600 transition-colors"
          title="Horizontal Divider"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* LINK */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("link")
              ? "bg-primary text-white shadow-xs"
              : "hover:bg-orange-100/70 text-neutral-600"
          }`}
          title="Insert / Edit Link"
        >
          <Link2 className="w-4 h-4" />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        {/* UNDO / REDO */}
        <div className="h-5 w-[1px] bg-orange-200 mx-0.5 ml-auto" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md hover:bg-orange-100/70 text-neutral-600 disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md hover:bg-orange-100/70 text-neutral-600 disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* EDITOR CANVAS */}
      <div
        className="tiptap-editor-wrapper p-4 cursor-text min-h-[320px] max-h-[600px] overflow-y-auto"
        onClick={() => {
          if (!editor.isFocused) {
            editor.commands.focus();
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* EDITOR FOOTER */}
      <div className="bg-neutral-50/80 border-t border-neutral-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="flex items-center gap-1 font-serif text-neutral-500">
          ✨ Rich spiritual formatting enabled
        </span>
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length} words</span>
          <span>{editor.getText().length} characters</span>
        </div>
      </div>
    </div>
  );
}
