"use client"

import { useState } from "react"
import type { MarkedArea, MapInstance } from "../types/map-types"
import { formatArea, formatDistance } from "../utils/map-calculations"

export function useMapAreas(mapInstance: MapInstance) {
  const [markedAreas, setMarkedAreas] = useState<MarkedArea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAreaName, setNewAreaName] = useState("")
  const [newAreaDescription, setNewAreaDescription] = useState("")

  const saveArea = (pendingArea: Partial<MarkedArea>, pendingLayer: any) => {
    if (!pendingArea || !newAreaName || !pendingLayer) return false

    const newArea: MarkedArea = {
      id: Date.now().toString(),
      name: newAreaName,
      description: newAreaDescription,
      type: pendingArea.type as "marker" | "polygon",
      coordinates: pendingArea.coordinates as [number, number] | [number, number][],
      color: pendingArea.color || "#ef4444",
      leafletId: window.L.stamp(pendingLayer),
      area: pendingArea.area,
      perimeter: pendingArea.perimeter,
    }

    // Add popup to the layer
    const popupContent = `
      <div>
        <h4 style="margin: 0 0 8px 0; font-weight: bold;">${newArea.name}</h4>
        ${newArea.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${newArea.description}</p>` : ""}
        ${
          newArea.area
            ? `<div style="font-size: 11px; color: #333;">
                <strong>Luas:</strong> ${formatArea(newArea.area)}<br>
                <strong>Keliling:</strong> ${formatDistance(newArea.perimeter || 0)}
              </div>`
            : ""
        }
      </div>
    `

    if (pendingLayer.bindPopup) {
      pendingLayer.bindPopup(popupContent)
    } else {
      // For layer groups, bind to all layers
      pendingLayer.eachLayer((layer: any) => {
        if (layer.bindPopup) {
          layer.bindPopup(popupContent)
        }
      })
    }

    setMarkedAreas((prev) => [...prev, newArea])
    setNewAreaName("")
    setNewAreaDescription("")
    setShowForm(false)

    return true
  }

  const deleteArea = (id: string) => {
    const area = markedAreas.find((a) => a.id === id)
    if (area && area.leafletId && mapInstance.map) {
      mapInstance.map.eachLayer((layer: any) => {
        if (window.L.stamp(layer) === area.leafletId) {
          mapInstance.map.removeLayer(layer)
        }
      })
    }
    setMarkedAreas((prev) => prev.filter((area) => area.id !== id))
  }

  const clearAllAreas = () => {
    if (mapInstance.map) {
      markedAreas.forEach((area) => {
        if (area.leafletId) {
          mapInstance.map.eachLayer((layer: any) => {
            if (window.L.stamp(layer) === area.leafletId) {
              mapInstance.map.removeLayer(layer)
            }
          })
        }
      })
    }
    setMarkedAreas([])
  }

  return {
    markedAreas,
    showForm,
    newAreaName,
    newAreaDescription,
    setShowForm,
    setNewAreaName,
    setNewAreaDescription,
    saveArea,
    deleteArea,
    clearAllAreas,
  }
}
