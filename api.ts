
export interface ProtocolStat {
  protocol: string
  packet_count: number
  total_bytes: number
}

export interface NetworkStats {
  total_packets: number
  protocols: ProtocolStat[]
}

export interface Packet {
  id: number
  timestamp: string
  src_ip: string | null
  dst_ip: string | null
  protocol: string
  src_port: number | null
  dst_port: number | null
  packet_size: number
}

export interface CaptureStatus {
  running: boolean
  interface: string
  captured_since_start: number
  errors: string[]
}

export interface SecurityAlert {
  id: number
  timestamp: string
  severity: string
  type: string
  src_ip: string
  message: string
  distinct_ports: number
}

export async function getStats(): Promise<NetworkStats> {
  const response = await fetch('/api/stats')
  if (!response.ok) throw new Error('Unable to load network statistics')
  return response.json()
}

export async function getPackets(limit = 10): Promise<Packet[]> {
  const response = await fetch(`/api/packets?limit=${limit}`)
  if (!response.ok) throw new Error('Unable to load packets')
  return response.json()
}

export async function getCaptureStatus(): Promise<CaptureStatus> {
  const response = await fetch('/api/capture/status')
  if (!response.ok) throw new Error('Unable to load capture status')
  return response.json()
}

export async function startCapture() {
  const response = await fetch('/api/capture/start', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Unable to start capture')
  }
  return data
}

export async function stopCapture() {
  const response = await fetch('/api/capture/stop', { method: 'POST' })
  if (!response.ok) throw new Error('Unable to stop capture')
  return response.json()
}
export async function getAlerts(): Promise<SecurityAlert[]> {
  const response = await fetch('/api/alerts')

  if (!response.ok) {
    throw new Error('Unable to load security alerts')
  }

  return response.json()
}