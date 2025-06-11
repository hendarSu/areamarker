"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { MAP_LAYERS, type MapLayerType } from "../hooks/use-map-layers"

interface MapLayerControlProps {
  currentLayer: MapLayerType
  onLayerChange: (layer: MapLayerType) => void
  disabled?: boolean
}

export function MapLayerControl({ currentLayer, onLayerChange, disabled = false }: MapLayerControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentLayerInfo = MAP_LAYERS.find((layer) => layer.id === currentLayer)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <span>{currentLayerInfo?.icon}</span>
        <span className="hidden sm:inline">{currentLayerInfo?.name}</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <Card className="absolute top-full mt-2 z-50 min-w-[200px] shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {MAP_LAYERS.map((layer) => (
                <Button
                  key={layer.id}
                  variant={currentLayer === layer.id ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    onLayerChange(layer.id)
                    setIsExpanded(false)
                  }}
                  disabled={disabled}
                >
                  <span className="mr-2">{layer.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{layer.name}</div>
                    <div className="text-xs text-muted-foreground">{layer.description}</div>
                  </div>
                  {currentLayer === layer.id && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Aktif
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
