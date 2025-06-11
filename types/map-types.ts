export interface MarkedArea {
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

export interface MapInstance {
  map: any
  isLoaded: boolean
}

export interface ConnectionStats {
  totalArea: number
  boundaryArea: number | null
}

declare global {
  interface Window {
    L: any
  }
}
