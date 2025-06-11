"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

export function useMap(mapContainerRef: React.RefObject<HTMLDivElement>) {
  const mapInstanceRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    loadLeafletAndInitialize()
    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
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
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Initialize map with default center (will be updated when user location is found)
    // Don't add any tile layer here - it will be handled by useMapLayers
    const map = window.L.map(mapContainerRef.current).setView([-6.2088, 106.8456], 11)

    mapInstanceRef.current = map
    setMapLoaded(true)

    // Get user location immediately and center map on it
    getUserLocationAndCenter()
  }

  const getUserLocationAndCenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])

          // Center map on user location with higher zoom
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15)

            // Add user location marker
            const userIcon = window.L.divIcon({
              html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;"></div>',
              iconSize: [16, 16],
              className: "user-location-marker",
            })

            window.L.marker([latitude, longitude], { icon: userIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup("📍 Lokasi Anda Saat Ini")
              .openPopup() // Auto-open popup to show current location
          }
        },
        (error) => {
          console.log("Geolocation error:", error)
          // Show user-friendly message for location access
          if (mapInstanceRef.current) {
            const errorPopup = window.L.popup()
              .setLatLng([-6.2088, 106.8456])
              .setContent(`
              <div style="text-align: center; padding: 8px;">
                <div style="color: #f59e0b; font-weight: bold; margin-bottom: 4px;">⚠️ Akses Lokasi Ditolak</div>
                <div style="font-size: 12px; color: #666;">
                  Izinkan akses lokasi untuk pengalaman yang lebih baik
                </div>
              </div>
            `)
              .openOn(mapInstanceRef.current)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    } else {
      console.log("Geolocation is not supported by this browser.")
    }
  }

  const centerOnUserLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userLocation, 15)
    }
  }

  const zoomToCoordinates = (coordinates: [number, number] | [number, number][]) => {
    if (!mapInstanceRef.current) return

    if (!Array.isArray(coordinates[0])) {
      // It's a marker
      const [lat, lng] = coordinates as [number, number]
      mapInstanceRef.current.setView([lat, lng], 16)
    } else {
      // It's a polygon
      const bounds = window.L.latLngBounds(coordinates as [number, number][])
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  return {
    map: mapInstanceRef.current,
    mapInstance: { map: mapInstanceRef.current, isLoaded: mapLoaded },
    mapLoaded,
    userLocation,
    centerOnUserLocation,
    zoomToCoordinates,
  }
}
