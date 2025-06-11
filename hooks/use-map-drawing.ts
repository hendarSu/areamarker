"use client"

import { useState } from "react"
import type { MarkedArea, MapInstance } from "../types/map-types"
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculateDistance,
  getPolygonCenter,
  formatArea,
  formatDistance,
} from "../utils/map-calculations"

export function useMapDrawing(mapInstance: MapInstance) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [pendingArea, setPendingArea] = useState<Partial<MarkedArea> | null>(null)
  const [pendingLayer, setPendingLayer] = useState<any>(null)

  const addMarker = (lat: number, lng: number) => {
    if (!mapInstance.map) return

    const marker = window.L.marker([lat, lng], {
      icon: window.L.divIcon({
        html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; border: 2px solid white; transform: rotate(-45deg);"></div>',
        iconSize: [20, 20],
        className: "custom-marker",
      }),
    }).addTo(mapInstance.map)

    setPendingArea({
      type: "marker",
      coordinates: [lat, lng],
      color: "#ef4444",
    })
    setPendingLayer(marker)
    return true
  }

  const startPolygonDrawing = () => {
    if (!mapInstance.map) return false

    setIsDrawing(true)
    mapInstance.map.getContainer().style.cursor = "crosshair"

    const points: [number, number][] = []
    const tempMarkers: any[] = []
    const tempLines: any[] = []

    const onMapClick = (e: any) => {
      const { lat, lng } = e.latlng
      points.push([lat, lng])

      // Add temporary marker with number
      const tempMarker = window.L.circleMarker([lat, lng], {
        radius: 8,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.8,
        weight: 2,
      }).addTo(mapInstance.map)

      // Add number label
      const numberMarker = window.L.divIcon({
        html: `<div style="background: white; border: 2px solid #3b82f6; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #3b82f6;">${points.length}</div>`,
        iconSize: [20, 20],
        className: "polygon-point-number",
      })

      const numberMarkerLayer = window.L.marker([lat, lng], { icon: numberMarker }).addTo(mapInstance.map)

      tempMarkers.push(tempMarker, numberMarkerLayer)

      // Draw line to previous point
      if (points.length > 1) {
        const line = window.L.polyline([points[points.length - 2], points[points.length - 1]], {
          color: "#3b82f6",
          weight: 3,
          dashArray: "10, 5",
        }).addTo(mapInstance.map)
        tempLines.push(line)

        // Add distance label on line
        const midPoint = [
          (points[points.length - 2][0] + points[points.length - 1][0]) / 2,
          (points[points.length - 2][1] + points[points.length - 1][1]) / 2,
        ]
        const distance = calculateDistance(points[points.length - 2], points[points.length - 1])
        const distanceLabel = window.L.divIcon({
          html: `<div style="background: rgba(59, 130, 246, 0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;">${distance.toFixed(0)}m</div>`,
          className: "distance-label",
        })
        const distanceLabelLayer = window.L.marker(midPoint as [number, number], { icon: distanceLabel }).addTo(
          mapInstance.map,
        )
        tempMarkers.push(distanceLabelLayer)
      }

      // Show closing line preview if we have 3+ points
      if (points.length >= 3) {
        const closingLine = window.L.polyline([points[points.length - 1], points[0]], {
          color: "#3b82f6",
          weight: 2,
          dashArray: "5, 10",
          opacity: 0.5,
        }).addTo(mapInstance.map)
        tempLines.push(closingLine)
      }
    }

    const completePolygon = () => {
      // Remove temporary markers and lines
      tempMarkers.forEach((marker) => mapInstance.map.removeLayer(marker))
      tempLines.forEach((line) => mapInstance.map.removeLayer(line))

      if (points.length >= 3) {
        // Calculate area and perimeter
        const area = calculatePolygonArea(points)
        const perimeter = calculatePolygonPerimeter(points)

        // Create final polygon
        const polygon = window.L.polygon(points, {
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.3,
          weight: 3,
        }).addTo(mapInstance.map)

        // Add area label in center
        const center = getPolygonCenter(points)
        const areaLabel = window.L.divIcon({
          html: `<div style="background: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; text-align: center; white-space: nowrap;">
            ${formatArea(area)}<br>
            <span style="font-size: 10px; opacity: 0.9;">Keliling: ${formatDistance(perimeter)}</span>
          </div>`,
          className: "area-label",
        })
        const areaLabelLayer = window.L.marker(center, { icon: areaLabel }).addTo(mapInstance.map)

        // Group polygon and label
        const polygonGroup = window.L.layerGroup([polygon, areaLabelLayer])

        setPendingArea({
          type: "polygon",
          coordinates: points,
          color: "#3b82f6",
          area: area,
          perimeter: perimeter,
        })
        setPendingLayer(polygonGroup)
      }

      // Clean up
      mapInstance.map.off("click", onMapClick)
      mapInstance.map.off("dblclick", completePolygon)
      mapInstance.map.getContainer().style.cursor = ""
      setIsDrawing(false)
    }

    mapInstance.map.on("click", onMapClick)
    mapInstance.map.on("dblclick", completePolygon)

    // Auto-complete after 15 seconds
    setTimeout(() => {
      if (isDrawing && points.length >= 3) {
        completePolygon()
      }
    }, 15000)

    return true
  }

  const cancelDrawing = () => {
    if (pendingLayer && mapInstance.map) {
      if (pendingLayer.removeFrom) {
        pendingLayer.removeFrom(mapInstance.map)
      } else {
        mapInstance.map.removeLayer(pendingLayer)
      }
    }
    setPendingArea(null)
    setPendingLayer(null)
    setIsDrawing(false)
  }

  return {
    isDrawing,
    pendingArea,
    pendingLayer,
    addMarker,
    startPolygonDrawing,
    cancelDrawing,
    setPendingArea,
    setPendingLayer,
  }
}
