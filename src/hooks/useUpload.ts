export async function uploadFile(file: File): Promise<{ url: string; publicId: string; size: string; name: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();

    function formatSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return {
        url: data.url,
        publicId: data.publicId,
        size: formatSize(data.size),
        name: data.name,
    };
}

export async function deleteFile(publicId: string): Promise<void> {
    await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
    });
}