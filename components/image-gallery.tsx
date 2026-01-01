"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, Download, ZoomIn } from "lucide-react"
import { glassCardStyle } from "@/lib/styles"

interface GeneratedImage {
  id: string
  category: string
  base64Data: string
  mimeType: string
  prompt: string
}

interface ImageGalleryProps {
  images: GeneratedImage[]
  title?: string
}

export function ImageGallery({ images, title = "AI-Generated Images" }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  if (!images || images.length === 0) {
    return null
  }

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement("a")
    link.href = `data:${image.mimeType};base64,${image.base64Data}`
    link.download = `tenderswarm-${image.category}-${image.id}.${image.mimeType.split("/")[1] || "png"}`
    link.click()
  }

  return (
    <>
      <Card className="p-6 rounded-2xl" style={glassCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-video rounded-xl overflow-hidden border border-border/50 cursor-pointer hover:border-purple-500/50 transition-all"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={`data:${image.mimeType};base64,${image.base64Data}`}
                alt={image.prompt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <Badge className="text-[10px] capitalize mb-1 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {image.category}
                  </Badge>
                  <p className="text-xs text-white/80 line-clamp-2">{image.prompt}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(image)
                    }}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors">
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <span className="capitalize">{selectedImage?.category} Visual</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedImage && handleDownload(selectedImage)}
                className="bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-border/50">
                <img
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.base64Data}`}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">AI Prompt</p>
                <p className="text-sm text-foreground">{selectedImage.prompt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
