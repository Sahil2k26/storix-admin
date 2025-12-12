"use client";
import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import Link from "next/link";

// TODO: MAKE IT PRODUCTION Ready
export default function PreviewButton({ storeId, storeName }: { storeId: string; storeName: string }) {
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    const StoreApiUrl = `http://host.docker.internal:3000/api/stores/${storeId}`
    const handlePreview = async () => {
        setLoading(true);
        try {
            const res = await axios.post("/api/preview-store", { StoreApiUrl, storeName });
            setPreviewUrl(res.data.url);
        } catch (err) {
            console.error("Error previewing store:", err);
            alert("Failed to preview store");
        }
        setLoading(false);
    };

    return (
        <div className="hidden ">
            {!previewUrl && <Button onClick={handlePreview} disabled={loading}>
                {loading ? "Loading..." : "Preview Store"}
            </Button>}

            {previewUrl && (
                <Button>
                    <Link href={previewUrl} target="_blank" rel="noopener noreferrer">
                        Open Preview
                    </Link>
                </Button>

            )}
        </div>
    );
}
