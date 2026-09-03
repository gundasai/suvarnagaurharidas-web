export interface BlogItem {
  id: string;
  title: string;
  image: string;
  content: string;
  summary?: string;
  author?: string;
  created_at?: { seconds: number; nanoseconds: number } | null;
}

export const DEFAULT_BLOGS: BlogItem[] = [
  {
    id: "art-of-mindful-living",
    title: "The Art of Mindful Living in a Fast-Paced World",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
    summary: "Discover how ancient Vedic principles can bring stillness, clarity, and deep fulfillment to modern daily life.",
    author: "Suvarna Gaura Hari Das",
    content: `In the hustle and bustle of modern society, our minds are constantly bombarded with notifications, deadlines, and endless streams of information. Yet, true fulfillment and peace cannot be found in external achievements alone.

Ancient Vedic wisdom teaches us that mindfulness is not simply a meditation practice—it is a way of life. By grounding ourselves in the present moment, practicing intentional reflection, and connecting with our higher self, we cultivate resilience against everyday anxieties.

Here are three simple daily habits to integrate mindfulness into your routine:

1. **Morning Silence (Mouna)**: Spend the first 15 minutes of your morning free from digital screens. Focus on deep breathing and gratitude.
2. **Intentional Work**: Approach your daily tasks as a form of selfless offering (Karma Yoga), placing full focus on the process rather than being attached only to results.
3. **Evening Reflection**: Before sleep, reflect on three positive experiences and release the stress of the day.

When we quiet the noise outside, we awaken the clarity and joy within.`
  },
  {
    id: "unlocking-gita-wisdom",
    title: "Unlocking Inner Peace Through Bhagavad Gita",
    image: "https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=800&auto=format&fit=crop",
    summary: "A deep dive into timeless spiritual teachings that help navigate stress, purpose, and self-mastery.",
    author: "Suvarna Gaura Hari Das",
    content: `The Bhagavad Gita is far more than an ancient scripture; it is a practical guidebook for self-mastery and emotional harmony in turbulent times.

Set on the battlefield of Kurukshetra, the conversation between Krishna and Arjuna symbolizes the internal conflicts we encounter every day—doubt, fear, confusion, and responsibility.

Through the teachings of the Gita, we learn the principle of Nishkama Karma: acting out of duty and compassion without letting fear of failure or desire for praise dictate our choices. This shift in mindset transforms work into devotion and stress into purpose.

Key Lessons for Everyday Living:
- **Mastering the Mind**: The mind can be a person's best friend or worst enemy. Disciplining thought through wisdom and meditation leads to lasting inner stability.
- **Seeing Unity in Diversity**: Recognizing the spiritual essence within every living entity fosters deep empathy and unity.
- **Finding Purpose**: Aligning our actions with our authentic nature (Swadharma) brings deep satisfaction and harmony.`
  },
  {
    id: "bridging-science-and-spirituality",
    title: "Bridging Science, Consciousness, and Spirituality",
    image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop",
    summary: "Exploring the intersection of modern analytical thinking and eternal wisdom traditions for holistic growth.",
    author: "Suvarna Gaura Hari Das",
    content: `Transitioning from an IBM software engineering background to a monastic life at ISKCON taught me that science and spirituality are not opposing forces—they are two lenses examining the same underlying reality.

Science explores the external universe through empirical observation, logic, and experimentation. Spirituality explores the internal universe through self-inquiry, consciousness, and personal realization.

When analytical rigor meets spiritual contemplation, life becomes a holistic quest for truth. Modern quantum physics is increasingly acknowledging concepts of non-locality and interconnectedness that Vedic sages described thousands of years ago.

By cultivating both critical thinking and spiritual devotion, we empower ourselves to make conscious decisions that serve our highest potential and the wellbeing of society.`
  }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedInitialBlogsToFirestore(db: any): Promise<BlogItem[]> {
  try {
    const { collection, getDocs, setDoc, doc, serverTimestamp } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "blogs"));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogItem));
    }

    // Seed initial blogs into Firestore DB
    const seeded: BlogItem[] = [];
    for (const blog of DEFAULT_BLOGS.slice(0, 2)) {
      const blogData = {
        title: blog.title,
        summary: blog.summary || "",
        content: blog.content,
        image: blog.image,
        author: blog.author || "Suvarna Gaura Hari Das",
        created_at: serverTimestamp(),
      };
      await setDoc(doc(db, "blogs", blog.id), blogData);
      seeded.push({ id: blog.id, ...blogData, created_at: null });
    }
    return seeded;
  } catch (error) {
    console.error("Error seeding initial blogs to Firestore:", error);
    return DEFAULT_BLOGS;
  }
}
