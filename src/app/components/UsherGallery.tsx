"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import "./UsherGallery.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FileMeta = {
  id: number;
  name: string;
  event_name: string;
  event_type: string;
  subtype?: string;
  url: string;
  created_at?: string;
};

export default function UserGallery() {
  const [gallery, setGallery] = useState<FileMeta[]>([]);
  const [groupedGallery, setGroupedGallery] = useState<Record<string, FileMeta[]>>({});
  const [loading, setLoading] = useState(true);

  // Fullscreen viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flatGallery, setFlatGallery] = useState<FileMeta[]>([]);
  const [zoomed, setZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetchVisibleMedia();
  }, []);

  useEffect(() => {
    const allFiles = Object.values(groupedGallery).flat();
    setFlatGallery(allFiles);
  }, [groupedGallery]);

  async function fetchVisibleMedia() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("media_metadata")
        .select("*")
        .eq("visible_to_users", true)
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      const grouped = (data ?? []).reduce((acc, item) => {
        const key = item.event_type || "MENGINE";
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, FileMeta[]>);

      setGallery(data ?? []);
      setGroupedGallery(grouped);
    } catch (err) {
      console.error("Error fetching visible media:", err);
    } finally {
      setLoading(false);
    }
  }

  function openViewer(fileId: number) {
    const idx = flatGallery.findIndex((f) => f.id === fileId);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setZoomed(false);
      setViewerOpen(true);
    }
  }

  const prevImage = useCallback(() => {
    setZoomed(false);
    setCurrentIndex((i) => (i === 0 ? flatGallery.length - 1 : i - 1));
  }, [flatGallery.length]);

  const nextImage = useCallback(() => {
    setZoomed(false);
    setCurrentIndex((i) => (i === flatGallery.length - 1 ? 0 : i + 1));
  }, [flatGallery.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!viewerOpen) return;

      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "Escape") {
        setViewerOpen(false);
      }
    },
    [viewerOpen, prevImage, nextImage]
  );

  useEffect(() => {
    if (viewerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      setZoomed(false);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      setZoomed(false);
    };
  }, [viewerOpen, handleKeyDown]);

  // Zoom toggle on double click/tap
  function toggleZoom() {
    setZoomed((z) => !z);
  }

  // Touch swipe detection (basic)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].screenX;
  }

  function onTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].screenX;
  }

  function onTouchEnd() {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const deltaX = touchStartX.current - touchEndX.current;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          nextImage();
        } else {
          prevImage();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (loading) {
    return <div>⏳ Inapakia picha...</div>;
  }

  if (gallery.length === 0) {
    return <div>😔 Hakuna picha zilizoruhusiwa kwa sasa.</div>;
  }

  return (
    <div className="user-gallery-container">
      <h2>📸 Gallery ya Matukio</h2>

      {Object.entries(groupedGallery).map(([type, files]) => (
        <div key={type}>
          <h3>{type.toUpperCase()}</h3>
          <div className="gallery-grid">
            {files.map((file) => (
              <div
                key={file.id}
                className="gallery-item"
                onClick={() => openViewer(file.id)}
                tabIndex={0}
                role="button"
                aria-label={`View image from ${file.event_name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openViewer(file.id);
                  }
                }}
              >
                <img src={file.url} alt={file.name} loading="lazy" />
                <strong>{file.event_name}</strong>
                {file.subtype && <span>{file.subtype}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fullscreen viewer */}
      {viewerOpen && flatGallery.length > 0 && (
        <div
          className="fullscreen-viewer"
          onClick={() => setViewerOpen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen photo viewer"
        >
          <div
            className={`viewer-content ${zoomed ? "zoomed" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setViewerOpen(false)}
              aria-label="Close viewer"
            >
              ✖
            </button>

            <button
              className="nav-btn prev-btn"
              onClick={prevImage}
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              className="nav-btn next-btn"
              onClick={nextImage}
              aria-label="Next image"
            >
              ›
            </button>

            <img
              ref={imgRef}
              src={flatGallery[currentIndex].url}
              alt={flatGallery[currentIndex].name}
              className="viewer-img"
              onDoubleClick={toggleZoom}
              loading="eager"
            />

            <div className="image-info">
              <h4>{flatGallery[currentIndex].event_name}</h4>
              {flatGallery[currentIndex].subtype && <p>{flatGallery[currentIndex].subtype}</p>}
              <small>
                {currentIndex + 1} / {flatGallery.length}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
