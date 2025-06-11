"use client"

import { useState } from "react"
import type { MapInstance } from "../types/map-types"

export type MapLayerType = "street" | "satellite" | "terrain" | "hybrid"

export interface MapLayer {
  id: MapLayerType
  name: string
  description: string
  icon: string
}

export const MAP_LAYERS: MapLayer[] = [
  {
    id: "street",
    name: "Street Map",
    description: "Peta jalan standar",
    icon: "🗺️",
  },
  {
    id: "satellite",
    name: "Satelit",
    description: "Citra satelit",
    icon: "🛰️",
  },
  {
    id: "terrain",
    name: "Terrain",
    description: "Peta topografi",
    icon: "🏔️",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Satelit + Label",
    icon: "🌍",
  },
]

export function useMapLayers(mapInstance: MapInstance) {
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>("street")
  const [layerInstances, setLayerInstances] = useState<{ [key: string]: any }>({})

  const initializeLayers = () => {
    if (!mapInstance.map || !window.L) return

    const layers = {
      street: window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }),
      satellite: window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        },
      ),
      terrain: window.L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
      }),
      hybrid: window.L.layerGroup([
        window.L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 19,
          },
        ),
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          opacity: 0.3,
        }),
      ]),
    }

    setLayerInstances(layers)

    // Add default layer
    layers.street.addTo(mapInstance.map)
  }

  const switchLayer = (layerType: MapLayerType) => {
    if (!mapInstance.map || !layerInstances[currentLayer] || !layerInstances[layerType]) return

    // Remove current layer
    mapInstance.map.removeLayer(layerInstances[currentLayer])

    // Add new layer
    layerInstances[layerType].addTo(mapInstance.map)

    setCurrentLayer(layerType)
  }

  return {
    currentLayer,
    layerInstances,
    initializeLayers,
    switchLayer,
  }
}
