"use client"

import { useEffect } from "react"

import { useState } from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, MapPin, Navigation, Ruler, Link } from "lucide-react"
import { useMap } from "../hooks/use-map"
import { useMapDrawing } from "../hooks/use-map-drawing"
import { useMapAreas } from "../hooks/use-map-areas"
import { useMapConnections } from "../hooks/use-map-connections"
import { useMapLayers } from "../hooks/use-map-layers"
import { MapLayerControl } from "./map-layer-control"
import { formatArea, formatDistance, getTotalArea } from "../utils/map-calculations"
import type { MarkedArea } from "../types/map-types"

export default function MapAreaMarker() {
  const mapRef = useRef<HTMLDivElement>(null)
  const { mapInstance, mapLoaded, userLocation, centerOnUserLocation, zoomToCoordinates } = useMap(mapRef)
  const { isDrawing, pendingArea, pendingLayer, addMarker, startPolygonDrawing, cancelDrawing } =
    useMapDrawing(mapInstance)
  const {
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
  } = useMapAreas(mapInstance)
  const { showConnections, connectionStats, toggleConnections, updateConnections, clearConnections } =
    useMapConnections(mapInstance)
  const { currentLayer, initializeLayers, switchLayer } = useMapLayers(mapInstance)

  const [selectedTool, setSelectedTool] = useState<"marker" | "polygon">("marker")

  // Initialize map layers when map is loaded
  useEffect(() => {
    if (mapInstance.isLoaded) {
      initializeLayers()
    }
  }, [mapInstance.isLoaded])

  const handleMapClick = (e: any) => {
    if (isDrawing || !mapInstance.map) return

    const { lat, lng } = e.latlng

    if (selectedTool === "marker") {
      const success = addMarker(lat, lng)
      if (success) setShowForm(true)
    } else if (selectedTool === "polygon") {
      startPolygonDrawing()
    }
  }

  const handleSaveArea = () => {
    const success = saveArea(pendingArea!, pendingLayer)
    if (success && showConnections) {
      updateConnections([...markedAreas, pendingArea as MarkedArea])
    }
  }

  const handleDeleteArea = (id: string) => {
    deleteArea(id)
    if (showConnections) {
      updateConnections(markedAreas.filter((area) => area.id !== id))
    }
  }

  const handleClearAllAreas = () => {
    clearAllAreas()
    clearConnections()
  }

  const handleToggleConnections = () => {
    toggleConnections(markedAreas)
  }

  const handleCancelArea = () => {
    cancelDrawing()
    setShowForm(false)
    setNewAreaName("")
    setNewAreaDescription("")
  }

  const zoomToArea = (area: MarkedArea) => {
    zoomToCoordinates(area.coordinates)
  }

  // Add event listener to map
  useEffect(() => {
    if (mapInstance.map && mapInstance.isLoaded) {
      mapInstance.map.on("click", handleMapClick)
      return () => {
        mapInstance.map.off("click", handleMapClick)
      }
    }
  }, [mapInstance.isLoaded, selectedTool, isDrawing])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Penanda Area di OpenStreetMap
          </CardTitle>
          <CardDescription>
            Peta akan otomatis mengarah ke lokasi Anda. Klik pada peta untuk marker atau pilih polygon untuk menggambar
            area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tools */}
          <div className="flex gap-2 flex-wrap items-center">
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
              onClick={handleToggleConnections}
              disabled={isDrawing || markedAreas.length < 2}
            >
              <Link className="h-4 w-4 mr-2" />
              Hubungkan Area
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2" />

            {/* Map Layer Control */}
            <MapLayerControl currentLayer={currentLayer} onLayerChange={switchLayer} disabled={isDrawing} />

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2" />

            {userLocation && (
              <Button variant="outline" size="sm" onClick={centerOnUserLocation} disabled={isDrawing}>
                <Navigation className="h-4 w-4 mr-2" />
                Kembali ke Lokasi Saya
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllAreas}
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
                  {getTotalArea(markedAreas) > 0 && (
                    <div>
                      <span className="font-medium">Luas Individual:</span> {formatArea(getTotalArea(markedAreas))}
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
                    {connectionStats.totalArea > 0 && (
                      <div>
                        <span className="font-medium">Total Area:</span> {formatArea(connectionStats.totalArea)}
                      </div>
                    )}
                    {connectionStats.boundaryArea && (
                      <div>
                        <span className="font-medium">Wilayah Boundary:</span>{" "}
                        {formatArea(connectionStats.boundaryArea)}
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

          {!mapLoaded && (
            <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Memuat peta dan mencari lokasi Anda...</span>
              </div>
            </div>
          )}
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
              <Button onClick={handleSaveArea} disabled={!newAreaName}>
                Simpan Area
              </Button>
              <Button variant="outline" onClick={handleCancelArea}>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteArea(area.id)} title="Hapus area">
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
