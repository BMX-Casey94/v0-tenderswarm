"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Film, Download, ExternalLink } from "lucide-react"
import { glassCardStyle } from "@/lib/styles"

interface GeneratedVideo {
  id: string
  category: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  prompt: string
}

interface VideoPlayerProps {
  videos: GeneratedVideo[]
}

export function VideoPlayer({ videos }: VideoPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(videos[0] || null)

  if (!videos || videos.length === 0) {
    return (
      <Card className="p-8 text-center" style={glassCardStyle}>
        <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No videos generated for this project</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Videos are available for Enterprise tier projects (5+ MNEE)
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main video player */}
      <Card className="overflow-hidden" style={glassCardStyle}>
        {selectedVideo?.videoUrl ? (
          <video
            src={selectedVideo.videoUrl}
            controls
            className="w-full aspect-video bg-black"
            poster={selectedVideo.thumbnailUrl}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full aspect-video bg-muted/20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Film className="w-10 h-10 text-primary" />
            </div>
            <p className="text-foreground font-medium">AI Video Generated</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedVideo?.duration || 15}s • {selectedVideo?.category || "Project"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-4 max-w-md text-center px-4">
              Video generation is available but requires additional processing. The video will be ready shortly.
            </p>
          </div>
        )}
      </Card>

      {/* Video info */}
      {selectedVideo && (
        <Card className="p-4" style={glassCardStyle}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 capitalize">
                  {selectedVideo.category}
                </span>
                <span className="text-xs text-muted-foreground">{selectedVideo.duration}s duration</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{selectedVideo.prompt}</p>
            </div>
            <div className="flex gap-2 ml-4">
              {selectedVideo.videoUrl && (
                <>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Video thumbnails (if multiple) */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={`shrink-0 w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedVideo?.id === video.id ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl || "/placeholder.svg"}
                  alt={video.category}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
