// Utility functions for map calculations

export const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
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

export const calculatePolygonArea = (points: [number, number][]): number => {
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

export const calculatePolygonPerimeter = (points: [number, number][]): number => {
  let perimeter = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    perimeter += calculateDistance(points[i], points[j])
  }
  return perimeter
}

export const getPolygonCenter = (points: [number, number][]): [number, number] => {
  const lat = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const lng = points.reduce((sum, point) => sum + point[1], 0) / points.length
  return [lat, lng]
}

export const formatArea = (area: number): string => {
  if (area >= 10000) {
    return `${(area / 10000).toFixed(2)} ha`
  } else {
    return `${area.toFixed(0)} m²`
  }
}

export const formatDistance = (distance: number): string => {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} km`
  } else {
    return `${distance.toFixed(0)} m`
  }
}

export const getConvexHull = (points: [number, number][]): [number, number][] => {
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

export const getTotalArea = (areas: { area?: number }[]): number => {
  return areas.reduce((total, area) => total + (area.area || 0), 0)
}
