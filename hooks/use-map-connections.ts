"use client"

import { useState, useRef } from "react"
import type { MarkedArea, MapInstance, ConnectionStats } from "../types/map-types"
import {
  calculateDistance,
  getPolygonCenter,
  formatDistance,
  formatArea,
  getConvexHull,
  calculatePolygonArea,
} from "../utils/map-calculations"

export function useMapConnections(mapInstance: MapInstance) {
  const [showConnections, setShowConnections] = useState(false)
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    totalArea: 0,
    boundaryArea: null,
  })
  const connectionLinesRef = useRef<any[]>([])

  const toggleConnections = (areas: MarkedArea[]) => {
    if (showConnections) {
      clearConnections()
    } else {
      updateConnections(areas)
    }
    setShowConnections(!showConnections)
  }

  const updateConnections = (areas: MarkedArea[]) => {
    clearConnections()

    if (areas.length < 2 || !mapInstance.map) {
      setConnectionStats({
        totalArea: 0,
        boundaryArea: null,
      })
      return
    }

    const connections: any[] = []
    let totalConnectedArea = 0
    const allPoints: [number, number][] = []

    // Calculate total area and collect all points
    areas.forEach((area) => {
      if (area.area) {
        totalConnectedArea += area.area
      }

      if (area.type === "marker") {
        allPoints.push(area.coordinates as [number, number])
      } else if (area.type === "polygon") {
        allPoints.push(...(area.coordinates as [number, number][]))
      }
    })

    // Create connections between areas
    for (let i = 0; i < areas.length - 1; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const area1 = areas[i]
        const area2 = areas[j]

        const point1 =
          area1.type === "marker" ? area1.coordinates : getPolygonCenter(area1.coordinates as [number, number][])
        const point2 =
          area2.type === "marker" ? area2.coordinates : getPolygonCenter(area2.coordinates as [number, number][])

        const distance = calculateDistance(point1 as [number, number], point2 as [number, number])

        const connectionLine = window.L.polyline([point1, point2], {
          color: "#ff6b6b",
          weight: 2,
          dashArray: "8, 8",
          opacity: 0.7,
        }).addTo(mapInstance.map)

        // Add distance label
        const midPoint = [
          ((point1 as [number, number])[0] + (point2 as [number, number])[0]) / 2,
          ((point1 as [number, number])[1] + (point2 as [number, number])[1]) / 2,
        ]

        const distanceLabel = window.L.divIcon({
          html: `<div style="background: rgba(255, 107, 107, 0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;">${formatDistance(distance)}</div>`,
          className: "connection-distance-label",
        })

        const distanceLabelLayer = window.L.marker(midPoint as [number, number], { icon: distanceLabel }).addTo(
          mapInstance.map,
        )

        connections.push(connectionLine, distanceLabelLayer)
      }
    }

    // Create boundary polygon for connected areas if we have enough points
    let boundaryArea = null
    if (allPoints.length >= 3) {
      // Calculate convex hull for boundary
      const hull = getConvexHull(allPoints)
      if (hull.length >= 3) {
        boundaryArea = calculatePolygonArea(hull)

        // Create boundary polygon
        const boundaryPolygon = window.L.polygon(hull, {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.1,
          weight: 3,
          dashArray: "15, 10",
        }).addTo(mapInstance.map)

        // Add total area label
        const center = getPolygonCenter(hull)
        const totalAreaLabel = window.L.divIcon({
          html: `<div style="background: rgba(16, 185, 129, 0.95); color: white; padding: 6px 12px; border-radius: 8px; font-size: 14px; font-weight: bold; text-align: center; white-space: nowrap; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          🌍 TOTAL WILAYAH TERHUBUNG<br>
          <span style="font-size: 16px;">${formatArea(boundaryArea)}</span><br>
          <span style="font-size: 11px; opacity: 0.9;">Area Individual: ${formatArea(totalConnectedArea)}</span><br>
          <span style="font-size: 11px; opacity: 0.9;">${areas.length} lokasi terhubung</span>
        </div>`,
          className: "total-area-label",
        })

        const totalAreaLabelLayer = window.L.marker(center, { icon: totalAreaLabel }).addTo(mapInstance.map)

        connections.push(boundaryPolygon, totalAreaLabelLayer)
      }
    }

    setConnectionStats({
      totalArea: totalConnectedArea,
      boundaryArea,
    })
    connectionLinesRef.current = connections
  }

  const clearConnections = () => {
    connectionLinesRef.current.forEach((line) => {
      if (mapInstance.map) {
        mapInstance.map.removeLayer(line)
      }
    })
    connectionLinesRef.current = []
    setConnectionStats({
      totalArea: 0,
      boundaryArea: null,
    })
  }

  return {
    showConnections,
    connectionStats,
    toggleConnections,
    updateConnections,
    clearConnections,
  }
}
