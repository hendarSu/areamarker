"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, MapPin, Navigation, Ruler, Link } from "lucide-react"

interface MarkedArea {
  id: string
  type: "marker" | "polygon"
  name: string
  description: string
  coordinates: [number, number] | [number, number][]
  color: string
  leafletId?: string
  area?: number // in square meters
  perimeter?: number // in meters
}

declare global {
  interface Window {
    L: any
  }
}

export default function MapAreaMarker() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [markedAreas, setMarkedAreas] = useState<MarkedArea[]>([])
  const [selectedTool, setSelectedTool] = useState<"marker" | "polygon">("marker")
  const [isDrawing, setIsDrawing] = useState(false)
  const [newAreaName, setNewAreaName] = useState("")
  const [newAreaDescription, setNewAreaDescription] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [pendingArea, setPendingArea] = useState<Partial<MarkedArea> | null>(null)
  const [pendingLayer, setPendingLayer] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [connectedTotalArea, setConnectedTotalArea] = useState<number>(0)
  const [connectedAreaBounds, setConnectedAreaBounds] = useState<any>(null)
  const [showConnections, setShowConnections] = useState(false)
  const connectionLinesRef = useRef<any[]>([])

  useEffect(() => {
    loadLeafletAndInitialize()
  }, [])

  const loadLeafletAndInitialize = async () => {
    if (typeof window !== "undefined" && !window.L) {
      // Load Leaflet CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => {
        initializeMap()
      }
      document.head.appendChild(script)
    } else if (window.L) {
      initializeMap()
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map centered on Jakarta, Indonesia
    const map = window.L.map(mapRef.current).setView([-6.2088, 106.8456], 11)

    // Add OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    setMapLoaded(true)

    // Add click event for markers
    map.on("click", handleMapClick)

    // Get user location
    getUserLocation()
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])

          // Add user location marker
          if (mapInstanceRef.current) {
            const userIcon = window.L.divIcon({
              html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;"></div>',
              iconSize: [16, 16],
              className: "user-location-marker",
            })

            window.L.marker([latitude, longitude], { icon: userIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup("Lokasi Anda")
          }
        },
        (error) => {
          console.log("Geolocation error:", error)
        },
      )
    }
  }

  const handleMapClick = (e: any) => {
    if (isDrawing || !mapInstanceRef.current) return

    const { lat, lng } = e.latlng

    if (selectedTool === "marker") {
      addMarker(lat, lng)
    } else if (selectedTool === "polygon") {
      startPolygonDrawing()
    }
  }

  const addMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return

    const marker = window.L.marker([lat, lng], {
      icon: window.L.divIcon({
        html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; border: 2px solid white; transform: rotate(-45deg);"></div>',
        iconSize: [20, 20],
        className: "custom-marker",
      }),
    }).addTo(mapInstanceRef.current)

    setPendingArea({
      type: "marker",
      coordinates: [lat, lng],
      color: "#ef4444",
    })
    setPendingLayer(marker)
    setShowForm(true)
  }

  const startPolygonDrawing = () => {
    if (!mapInstanceRef.current) return

    setIsDrawing(true)
    mapInstanceRef.current.getContainer().style.cursor = "crosshair"

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
      }).addTo(mapInstanceRef.current)

      // Add number label
      const numberMarker = window.L.divIcon({
        html: `<div style="background: white; border: 2px solid #3b82f6; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #3b82f6;">${points.length}</div>`,
        iconSize: [20, 20],
        className: "polygon-point-number",
      })

      const numberMarkerLayer = window.L.marker([lat, lng], { icon: numberMarker }).addTo(mapInstanceRef.current)

      tempMarkers.push(tempMarker, numberMarkerLayer)

      // Draw line to previous point
      if (points.length > 1) {
        const line = window.L.polyline([points[points.length - 2], points[points.length - 1]], {
          color: "#3b82f6",
          weight: 3,
          dashArray: "10, 5",
        }).addTo(mapInstanceRef.current)
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
          mapInstanceRef.current,
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
        }).addTo(mapInstanceRef.current)
        tempLines.push(closingLine)
      }
    }

    const completePolygon = () => {
      // Remove temporary markers and lines
      tempMarkers.forEach((marker) => mapInstanceRef.current.removeLayer(marker))
      tempLines.forEach((line) => mapInstanceRef.current.removeLayer(line))

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
        }).addTo(mapInstanceRef.current)

        // Add area label in center
        const center = getPolygonCenter(points)
        const areaLabel = window.L.divIcon({
          html: `<div style="background: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; text-align: center; white-space: nowrap;">
            ${formatArea(area)}<br>
            <span style="font-size: 10px; opacity: 0.9;">Keliling: ${formatDistance(perimeter)}</span>
          </div>`,
          className: "area-label",
        })
        const areaLabelLayer = window.L.marker(center, { icon: areaLabel }).addTo(mapInstanceRef.current)

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
        setShowForm(true)
      }

      // Clean up
      mapInstanceRef.current.off("click", onMapClick)
      mapInstanceRef.current.off("dblclick", completePolygon)
      mapInstanceRef.current.getContainer().style.cursor = ""
      setIsDrawing(false)
    }

    mapInstanceRef.current.on("click", onMapClick)
    mapInstanceRef.current.on("dblclick", completePolygon)

    // Auto-complete after 15 seconds
    setTimeout(() => {
      if (isDrawing && points.length >= 3) {
        completePolygon()
      }
    }, 15000)
  }

  // Utility functions for calculations
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371000 // Earth's radius in meters
    const lat1 = (point1[0] * Math.PI) / 180
    const lat2 = (point2[0] * Math.PI) / 180
    const deltaLat = ((point2[0] - point1[0]) * Math.PI) / 180
    const deltaLng = ((point2[1] - point1[1]) * Math.PI) / 180

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const calculatePolygonArea = (points: [number, number][]): number => {
    if (points.length < 3) return 0

    const R = 6371000 // Earth's radius in meters
    let area = 0

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const lat1 = (points[i][0] * Math.PI) / 180
      const lat2 = (points[j][0] * Math.PI) / 180
      const lng1 = (points[i][1] * Math.PI) / 180
      const lng2 = (points[j][1] * Math.PI) / 180

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
    }

    area = Math.abs((area * R * R) / 2)
    return area
  }

  const calculatePolygonPerimeter = (points: [number, number][]): number => {
    let perimeter = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      perimeter += calculateDistance(points[i], points[j])
    }
    return perimeter
  }

  const getPolygonCenter = (points: [number, number][]): [number, number] => {
    const lat = points.reduce((sum, point) => sum + point[0], 0) / points.length
    const lng = points.reduce((sum, point) => sum + point[1], 0) / points.length
    return [lat, lng]
  }

  const formatArea = (area: number): string => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`
    } else {
      return `${area.toFixed(0)} m²`
    }
  }

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`
    } else {
      return `${distance.toFixed(0)} m`
    }
  }

  const getConvexHull = (points: [number, number][]): [number, number][] => {
    if (points.length < 3) return points

    // Simple convex hull algorithm (Graham scan simplified)
    const sortedPoints = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])

    const cross = (o: [number, number], a: [number, number], b: [number, number]) => {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    }

    // Build lower hull
    const lower: [number, number][] = []
    for (const point of sortedPoints) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop()
      }
      lower.push(point)
    }

    // Build upper hull
    const upper: [number, number][] = []
    for (let i = sortedPoints.length - 1; i >= 0; i--) {
      const point = sortedPoints[i]
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop()
      }
      upper.push(point)
    }

    // Remove last point of each half because it's repeated
    lower.pop()
    upper.pop()

    return lower.concat(upper)
  }

  const saveArea = () => {
    if (!pendingArea || !newAreaName || !pendingLayer) return

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
    setPendingArea(null)
    setPendingLayer(null)

    // Update connections if enabled
    if (showConnections) {
      updateConnections([...markedAreas, newArea])
    }
  }

  const cancelArea = () => {
    if (pendingLayer && mapInstanceRef.current) {
      if (pendingLayer.removeFrom) {
        pendingLayer.removeFrom(mapInstanceRef.current)
      } else {
        mapInstanceRef.current.removeLayer(pendingLayer)
      }
    }
    setShowForm(false)
    setPendingArea(null)
    setPendingLayer(null)
    setNewAreaName("")
    setNewAreaDescription("")
  }

  const deleteArea = (id: string) => {
    const area = markedAreas.find((a) => a.id === id)
    if (area && area.leafletId && mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (window.L.stamp(layer) === area.leafletId) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
    }
    const updatedAreas = markedAreas.filter((area) => area.id !== id)
    setMarkedAreas(updatedAreas)

    // Update connections
    if (showConnections) {
      updateConnections(updatedAreas)
    }
  }

  const clearAllAreas = () => {
    if (mapInstanceRef.current) {
      markedAreas.forEach((area) => {
        if (area.leafletId) {
          mapInstanceRef.current.eachLayer((layer: any) => {
            if (window.L.stamp(layer) === area.leafletId) {
              mapInstanceRef.current.removeLayer(layer)
            }
          })
        }
      })
    }
    setMarkedAreas([])
    clearConnections()
  }

  const toggleConnections = () => {
    if (showConnections) {
      clearConnections()
    } else {
      updateConnections(markedAreas)
    }
    setShowConnections(!showConnections)
  }

  const updateConnections = (areas: MarkedArea[]) => {
    clearConnections()

    if (areas.length < 2) {
      setConnectedTotalArea(0)
      setConnectedAreaBounds(null)
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
        }).addTo(mapInstanceRef.current)

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
          mapInstanceRef.current,
        )

        connections.push(connectionLine, distanceLabelLayer)
      }
    }

    // Create boundary polygon for connected areas if we have enough points
    if (allPoints.length >= 3) {
      // Calculate convex hull for boundary
      const hull = getConvexHull(allPoints)
      if (hull.length >= 3) {
        const boundaryArea = calculatePolygonArea(hull)

        // Create boundary polygon
        const boundaryPolygon = window.L.polygon(hull, {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.1,
          weight: 3,
          dashArray: "15, 10",
        }).addTo(mapInstanceRef.current)

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

        const totalAreaLabelLayer = window.L.marker(center, { icon: totalAreaLabel }).addTo(mapInstanceRef.current)

        connections.push(boundaryPolygon, totalAreaLabelLayer)
        setConnectedAreaBounds(boundaryArea)
      }
    }

    setConnectedTotalArea(totalConnectedArea)
    connectionLinesRef.current = connections
  }

  const clearConnections = () => {
    connectionLinesRef.current.forEach((line) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(line)
      }
    })
    connectionLinesRef.current = []
    setConnectedTotalArea(0)
    setConnectedAreaBounds(null)
  }

  const centerOnUserLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userLocation, 15)
    }
  }

  const zoomToArea = (area: MarkedArea) => {
    if (!mapInstanceRef.current) return

    if (area.type === "marker") {
      const [lat, lng] = area.coordinates as [number, number]
      mapInstanceRef.current.setView([lat, lng], 16)
    } else if (area.type === "polygon") {
      const bounds = window.L.latLngBounds(area.coordinates as [number, number][])
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  const getTotalArea = (): number => {
    return markedAreas.reduce((total, area) => total + (area.area || 0), 0)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Penanda Area di OpenStreetMap
          </CardTitle>
          <CardDescription>
            Klik pada peta untuk marker atau pilih polygon untuk menggambar area. Double-click untuk menyelesaikan
            polygon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tools */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedTool === "marker" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("marker")}
              disabled={isDrawing}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Marker
            </Button>
            <Button
              variant={selectedTool === "polygon" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("polygon")}
              disabled={isDrawing}
            >
              <Ruler className="h-4 w-4 mr-2" />
              Area Polygon
            </Button>
            <Button
              variant={showConnections ? "default" : "outline"}
              size="sm"
              onClick={toggleConnections}
              disabled={isDrawing || markedAreas.length < 2}
            >
              <Link className="h-4 w-4 mr-2" />
              Hubungkan Area
            </Button>
            {userLocation && (
              <Button variant="outline" size="sm" onClick={centerOnUserLocation} disabled={isDrawing}>
                <Navigation className="h-4 w-4 mr-2" />
                Lokasi Saya
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllAreas}
              disabled={isDrawing || markedAreas.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          </div>

          {/* Statistics */}
          {markedAreas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-2">📊 Statistik Area</div>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Total Lokasi:</span>{" "}
                    {markedAreas.filter((a) => a.type === "marker").length} marker,{" "}
                    {markedAreas.filter((a) => a.type === "polygon").length} polygon
                  </div>
                  {getTotalArea() > 0 && (
                    <div>
                      <span className="font-medium">Luas Individual:</span> {formatArea(getTotalArea())}
                    </div>
                  )}
                </div>
              </div>

              {showConnections && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="font-medium text-green-700 mb-2">🌍 Wilayah Terhubung</div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Status:</span> {markedAreas.length} lokasi terhubung
                    </div>
                    {connectedTotalArea > 0 && (
                      <div>
                        <span className="font-medium">Total Area:</span> {formatArea(connectedTotalArea)}
                      </div>
                    )}
                    {connectedAreaBounds && (
                      <div>
                        <span className="font-medium">Wilayah Boundary:</span> {formatArea(connectedAreaBounds)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map */}
          <div
            ref={mapRef}
            className="w-full h-96 border rounded-lg overflow-hidden bg-gray-100"
            style={{ minHeight: "400px" }}
          />

          {isDrawing && (
            <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <div className="font-medium mb-1">Mode Menggambar Polygon Aktif</div>
              <div>Klik pada peta untuk menambah titik. Double-click atau tunggu 15 detik untuk menyelesaikan.</div>
            </div>
          )}

          {!mapLoaded && <div className="text-center text-sm text-muted-foreground">Memuat peta OpenStreetMap...</div>}
        </CardContent>
      </Card>

      {/* Form for new area */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Informasi Area</CardTitle>
            <CardDescription>
              Berikan nama dan deskripsi untuk{" "}
              {pendingArea?.type === "marker" ? "marker" : `area polygon (${formatArea(pendingArea?.area || 0)})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="area-name">Nama Area</Label>
              <Input
                id="area-name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Masukkan nama area..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area-description">Deskripsi</Label>
              <Textarea
                id="area-description"
                value={newAreaDescription}
                onChange={(e) => setNewAreaDescription(e.target.value)}
                placeholder="Masukkan deskripsi area..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveArea} disabled={!newAreaName}>
                Simpan Area
              </Button>
              <Button variant="outline" onClick={cancelArea}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List of marked areas */}
      {markedAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Area yang Ditandai ({markedAreas.length})</CardTitle>
            <CardDescription>Daftar semua area yang telah ditandai di peta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {markedAreas.map((area) => (
                <div key={area.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium cursor-pointer hover:text-blue-600" onClick={() => zoomToArea(area)}>
                        {area.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {area.type === "marker" ? "Marker" : "Polygon"}
                      </Badge>
                      {area.area && (
                        <Badge variant="outline" className="text-xs">
                          {formatArea(area.area)}
                        </Badge>
                      )}
                    </div>
                    {area.description && <p className="text-sm text-muted-foreground mb-2">{area.description}</p>}
                    <div className="text-xs text-muted-foreground">
                      {area.type === "marker" ? (
                        <p>
                          Koordinat: {(area.coordinates as [number, number])[0]?.toFixed(6)},{" "}
                          {(area.coordinates as [number, number])[1]?.toFixed(6)}
                        </p>
                      ) : (
                        <div>
                          <p>Titik: {(area.coordinates as [number, number][]).length} koordinat</p>
                          {area.perimeter && <p>Keliling: {formatDistance(area.perimeter)}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => zoomToArea(area)} title="Zoom ke area">
                      <Navigation className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteArea(area.id)} title="Hapus area">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
