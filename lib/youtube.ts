export function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getYouTubeThumbnail(url: string): string {
    const id = getYouTubeId(url);
    if (!id) return "/course-placeholder.jpg"; // Local Fallback
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function getYouTubeThumbnailFallback(url: string): string {
    const id = getYouTubeId(url);
    if (!id) return "/course-placeholder.jpg";
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
