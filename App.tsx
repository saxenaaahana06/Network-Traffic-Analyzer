
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Gauge, GitBranch,
  LayoutDashboard, Network, RefreshCw, Search, Settings,
  ShieldAlert, ShieldCheck, Wifi, X, Play, Square,
} from 'lucide-react'
import {
  getStats, getPackets, getCaptureStatus, startCapture,
  stopCapture, getAlerts,
} from './api'
import type { NetworkStats, Packet, CaptureStatus, SecurityAlert } from './api'
import './App.css'
import './styles/dashboard.css'

type Page = 'Overview' | 'Live Packets' | 'Analytics' | 'Connections' | 'Alerts' | 'Settings'

const navigation: { label: Page; icon: ReactNode }[] = [
  { label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { label: 'Live Packets', icon: <Activity size={18} /> },
  { label: 'Analytics', icon: <Gauge size={18} /> },
  { label: 'Connections', icon: <GitBranch size={18} /> },
  { label: 'Alerts', icon: <Bell size={18} /> },
  { label: 'Settings', icon: <Settings size={18} /> },
]

const chartColors = ['#6478f5', '#32b8a0', '#f2ad55', '#e77689', '#9b83e8', '#57a9d8']

function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<NetworkStats>({ total_packets: 0, protocols: [] })
  const [packets, setPackets] = useState<Packet[]>([])
  const [capture, setCapture] = useState<CaptureStatus>({
    running: false, interface: 'Wi-Fi', captured_since_start: 0, errors: [],
  })
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [protocolFilter, setProtocolFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const pageSize = 10

  const refreshData = useCallback(async () => {
    try {
      const [newStats, newPackets, newCapture, newAlerts] = await Promise.all([
        getStats(), getPackets(100), getCaptureStatus(), getAlerts(),
      ])
      setStats(newStats)
      setPackets(newPackets)
      setCapture(newCapture)
      setAlerts(newAlerts)
      setApiError('')
      setLastUpdated(new Date())
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to connect to the backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const update = async () => {
      try {
        const [newStats, newPackets, newCapture, newAlerts] = await Promise.all([
          getStats(), getPackets(100), getCaptureStatus(), getAlerts(),
        ])
        if (!active) return
        setStats(newStats)
        setPackets(newPackets)
        setCapture(newCapture)
        setAlerts(newAlerts)
        setApiError('')
        setLastUpdated(new Date())
      } catch (error) {
        if (!active) return
        setApiError(error instanceof Error ? error.message : 'Unable to connect to the backend.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const initialTimer = window.setTimeout(() => void update(), 0)
    const interval = window.setInterval(() => void update(), 3000)

    return () => {
      active = false
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [])

  const filteredPackets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return packets.filter((packet) => {
      const matchesProtocol = protocolFilter === 'All' ||
        packet.protocol.toUpperCase() === protocolFilter.toUpperCase()
      const matchesSearch = !query || [
        packet.src_ip, packet.dst_ip, packet.protocol,
        packet.src_port, packet.dst_port, packet.id,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))
      return matchesProtocol && matchesSearch
    })
  }, [packets, protocolFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredPackets.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const visiblePackets = filteredPackets.slice((safePage - 1) * pageSize, safePage * pageSize)

  const startCaptureHandler = async () => {
    setActionLoading(true)
    try {
      await startCapture()
      await refreshData()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to start capture.')
    } finally {
      setActionLoading(false)
    }
  }

  const stopCaptureHandler = async () => {
    setActionLoading(true)
    try {
      await stopCapture()
      await refreshData()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to stop capture.')
    } finally {
      setActionLoading(false)
    }
  }

  const protocols = useMemo(
    () => [...new Set(stats.protocols.map((item) => item.protocol))].sort(),
    [stats.protocols],
  )
  const totalBytes = stats.protocols.reduce((sum, item) => sum + item.total_bytes, 0)
  const unknownProtocols = packets.filter(
    p => !['TCP', 'UDP', 'ICMP', 'IPv6', 'ARP', 'Other'].includes(p.protocol),
  ).length
  const missingIPs = packets.filter(p => !p.src_ip || !p.dst_ip).length

  const packetTableProps = {
    packets: visiblePackets,
    allPackets: filteredPackets,
    search,
    setSearch: (value: string) => { setSearch(value); setCurrentPage(1) },
    protocolFilter,
    setProtocolFilter: (value: string) => { setProtocolFilter(value); setCurrentPage(1) },
    protocols,
    currentPage: safePage,
    totalPages,
    setCurrentPage,
    loading,
    apiError,
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Network size={23} /></div>
          <div className="brand-copy">
            <strong>NetMirror</strong>
            <span>NETWORK INTELLIGENCE</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.map(item => (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${page === item.label ? 'active' : ''}`}
              onClick={() => setPage(item.label)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.label === 'Live Packets' && capture.running && <span className="live-indicator" />}
              {item.label === 'Alerts' && alerts.length > 0 && (
                <span className="live-indicator" title={`${alerts.length} alerts`} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`status-dot ${capture.running ? 'online' : ''}`} />
            <div>
              <strong>{capture.running ? 'Capture active' : 'Capture stopped'}</strong>
              <span>{capture.interface}</span>
            </div>
          </div>
          <div className="sidebar-footer"><ShieldCheck size={15} />Local network monitoring</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span><ChevronRight size={15} /><strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="connection-label"><span className="status-dot online" />Local API</span>
            <button type="button" className="icon-button" title="Refresh dashboard" onClick={() => void refreshData()}>
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        {apiError && (
          <div className="error-banner">
            <CircleHelp size={18} /><span>{apiError}</span>
            <button type="button" className="icon-button" aria-label="Dismiss error" onClick={() => setApiError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {page === 'Overview' ? (
          <section className="dashboard-page">
            <PageHeading
              eyebrow="NETWORK WORKSPACE"
              title="Network overview"
              description="Monitor traffic, inspect packets, and understand your network."
            >
              <CaptureButton running={capture.running} busy={actionLoading} onStart={startCaptureHandler} onStop={stopCaptureHandler} />
            </PageHeading>

            <CaptureBanner capture={capture} />

            <div className="stats-grid">
              <StatCard label="Total packets" value={stats.total_packets.toLocaleString()} detail="Packets stored in database" icon={<Activity size={19} />} tone="blue" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Protocols detected" value={stats.protocols.length.toString()} detail="Unique protocol types" icon={<GitBranch size={19} />} tone="purple" trend={<Network size={16} />} />
              <StatCard label="Data processed" value={formatBytes(totalBytes)} detail="Total recorded packet bytes" icon={<Gauge size={19} />} tone="green" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Session packets" value={capture.captured_since_start.toLocaleString()} detail="Captured since last start" icon={<Clock3 size={19} />} tone="orange" trend={<ArrowDownRight size={16} />} />
            </div>

            <div className="overview-grid">
              <ProtocolDistribution stats={stats} loading={loading} />
              <CaptureStatusCard capture={capture} lastUpdated={lastUpdated} />
            </div>
            <PacketTable {...packetTableProps} />
          </section>
        ) : page === 'Live Packets' ? (
          <section className="dashboard-page">
            <PageHeading eyebrow="NETWORK WORKSPACE" title="Live packets" description="Search, filter, and inspect packets recorded by your analyzer.">
              <CaptureButton running={capture.running} busy={actionLoading} onStart={startCaptureHandler} onStop={stopCaptureHandler} />
            </PageHeading>
            <CaptureBanner capture={capture} />
            <PacketTable {...packetTableProps} />
          </section>
        ) : page === 'Analytics' ? (
          <section className="dashboard-page">
            <PageHeading eyebrow="NETWORK WORKSPACE" title="Network analytics" description="Understand protocol distribution and recorded network traffic.">
              <button type="button" className="secondary-button" onClick={() => void refreshData()}><RefreshCw size={16} />Refresh analytics</button>
            </PageHeading>
            <div className="stats-grid">
              <StatCard label="Total packets" value={stats.total_packets.toLocaleString()} detail="Packets stored in the database" icon={<Activity size={19} />} tone="blue" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Protocols detected" value={stats.protocols.length.toString()} detail="Unique protocol types" icon={<GitBranch size={19} />} tone="purple" trend={<Network size={16} />} />
              <StatCard label="Total traffic" value={formatBytes(totalBytes)} detail="Combined recorded packet bytes" icon={<Gauge size={19} />} tone="green" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Average packet size" value={stats.total_packets ? formatBytes(Math.round(totalBytes / stats.total_packets)) : '0 B'} detail="Across recorded protocol totals" icon={<Activity size={19} />} tone="orange" trend={<ArrowDownRight size={16} />} />
            </div>
            <ProtocolDistribution stats={stats} loading={loading} showBytes />
            <section className="dashboard-card packet-card">
              <div className="section-heading"><div><h2>Recent traffic sample</h2><p>Latest packets returned by the backend</p></div><span className="packet-total">{packets.length} packets</span></div>
              <PacketTable {...packetTableProps} />
            </section>
          </section>
        ) : page === 'Connections' ? (
          <section className="dashboard-page">
            <PageHeading eyebrow="NETWORK WORKSPACE" title="Network connections" description="Explore conversations observed in your recorded packet data.">
              <button type="button" className="secondary-button" onClick={() => void refreshData()}><RefreshCw size={16} />Refresh connections</button>
            </PageHeading>
            <div className="stats-grid">
              <StatCard label="Observed conversations" value={new Set(packets.map(p => `${p.src_ip ?? 'Unknown'}|${p.dst_ip ?? 'Unknown'}|${p.protocol}|${p.src_port ?? '-'}|${p.dst_port ?? '-'}`)).size.toLocaleString()} detail="Distinct combinations in the loaded sample" icon={<GitBranch size={19} />} tone="blue" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Unique source IPs" value={new Set(packets.map(p => p.src_ip).filter(Boolean)).size.toLocaleString()} detail="Sources in the loaded sample" icon={<Network size={19} />} tone="purple" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Unique destination IPs" value={new Set(packets.map(p => p.dst_ip).filter(Boolean)).size.toLocaleString()} detail="Destinations in the loaded sample" icon={<Activity size={19} />} tone="green" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Loaded packets" value={packets.length.toLocaleString()} detail="Packets available to this page" icon={<Gauge size={19} />} tone="orange" trend={<ArrowUpRight size={16} />} />
            </div>
            <section className="dashboard-card packet-card">
              <div className="section-heading"><div><h2>Observed conversations</h2><p>Grouped from packets currently loaded from the backend</p></div><span className="packet-total">{packets.length} packets</span></div>
              {packets.length ? (
                <div className="table-wrapper">
                  <table className="packet-table">
                    <thead><tr><th>Source</th><th>Destination</th><th>Protocol</th><th>Ports</th><th>Packets</th><th>Total bytes</th></tr></thead>
                    <tbody>
                      {Object.values(packets.reduce<Record<string, {src:string;dst:string;protocol:string;srcPort:number|null;dstPort:number|null;count:number;bytes:number}>>((groups,p) => {
                        const key = `${p.src_ip ?? 'Unknown'}|${p.dst_ip ?? 'Unknown'}|${p.protocol}|${p.src_port ?? '-'}|${p.dst_port ?? '-'}`
                        if (!groups[key]) groups[key] = {src:p.src_ip ?? 'Unknown',dst:p.dst_ip ?? 'Unknown',protocol:p.protocol,srcPort:p.src_port,dstPort:p.dst_port,count:0,bytes:0}
                        groups[key].count++
                        groups[key].bytes += p.packet_size
                        return groups
                      }, {})).sort((a,b) => b.count-a.count).map((c,i) => (
                        <tr key={`${c.src}-${c.dst}-${c.protocol}-${c.srcPort}-${c.dstPort}-${i}`}>
                          <td>{c.src}</td><td>{c.dst}</td>
                          <td><span className={`protocol-badge protocol-${c.protocol.toLowerCase()}`}>{c.protocol}</span></td>
                          <td>{c.srcPort ?? '—'} → {c.dstPort ?? '—'}</td><td>{c.count.toLocaleString()}</td><td>{formatBytes(c.bytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty-table">{loading ? 'Loading connection data...' : 'No packet data available. Start a capture to collect traffic.'}</div>}
            </section>
          </section>
        ) : page === 'Alerts' ? (
          <section className="dashboard-page">
            <PageHeading eyebrow="NETWORK SECURITY" title="Network alerts" description="Review suspicious traffic patterns detected during live capture.">
              <button type="button" className="secondary-button" onClick={() => void refreshData()}><RefreshCw size={16} />Refresh alerts</button>
            </PageHeading>

            <div className="stats-grid">
              <StatCard label="Packets reviewed" value={packets.length.toLocaleString()} detail="Packets in the loaded sample" icon={<Activity size={19} />} tone="blue" trend={<ArrowUpRight size={16} />} />
              <StatCard label="Unclassified protocols" value={unknownProtocols.toLocaleString()} detail="Protocols outside the common list" icon={<ShieldAlert size={19} />} tone="orange" trend={<CircleHelp size={16} />} />
              <StatCard label="Packets without IPs" value={missingIPs.toLocaleString()} detail="May include non-IP traffic" icon={<Network size={19} />} tone="purple" trend={<CircleHelp size={16} />} />
              <StatCard label="Capture status" value={capture.running ? 'Active' : 'Stopped'} detail="Current packet capture state" icon={<ShieldCheck size={19} />} tone={capture.running ? 'green' : 'orange'} trend={<Activity size={16} />} />
            </div>

            <section className="dashboard-card packet-card">
              <div className="section-heading">
                <div><h2>Live security alerts</h2><p>Possible port scans detected during live capture</p></div>
                <span className="packet-total">{alerts.length} alerts</span>
              </div>
              {alerts.length > 0 ? (
                <div className="protocol-list">
                  {alerts.map(alert => (
                    <article className="protocol-row" key={alert.id}>
                      <div className="protocol-row-top">
                        <span className="protocol-name"><ShieldAlert size={16} />{alert.type}</span>
                        <span className="protocol-count">{alert.severity.toUpperCase()}</span>
                      </div>
                      <p className="page-description">{alert.message}</p>
                      <div className="activity-metric"><span>Source IP</span><strong>{alert.src_ip}</strong></div>
                      <div className="activity-metric"><span>Distinct destination ports</span><strong>{alert.distinct_ports}</strong></div>
                      <div className="activity-metric"><span>Detected at</span><strong>{formatTimestamp(alert.timestamp)}</strong></div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-table">
                  {capture.running ? 'No possible port scans detected yet. Monitoring live traffic.' : 'No alerts recorded. Start capture to monitor live traffic.'}
                </div>
              )}
              <p className="page-description">These alerts identify suspicious patterns and do not confirm an attack.</p>
            </section>

            <section className="dashboard-card packet-card">
              <div className="section-heading"><div><h2>Traffic indicators</h2><p>Basic indicators, not confirmed security threats</p></div><ShieldAlert size={19} /></div>
              <div className="protocol-list">
                <Indicator title="Unclassified protocols" count={unknownProtocols} description="Packets outside the common protocol list." />
                <Indicator title="Packets missing endpoint IPs" count={missingIPs} description="Some link-layer traffic may not contain IP addresses." />
                <div className="protocol-row">
                  <div className="protocol-row-top"><span className="protocol-name">Capture errors reported</span><span className="protocol-count">{capture.errors.length}</span></div>
                  {capture.errors.length > 0 && <ul>{capture.errors.map((error,i) => <li key={`${error}-${i}`}>{error}</li>)}</ul>}
                </div>
              </div>
            </section>
            <PacketTable {...packetTableProps} />
          </section>
        ) : (
          <section className="dashboard-page">
            <PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage dashboard refresh behavior and capture controls.">
              <button type="button" className="secondary-button" onClick={() => void refreshData()}><RefreshCw size={16} />Refresh status</button>
            </PageHeading>
            <div className="stats-grid">
              <StatCard label="Backend connection" value={apiError ? 'Issue' : 'Connected'} detail={apiError || 'Backend responses received'} icon={<Activity size={19} />} tone={apiError ? 'orange' : 'green'} trend={<Network size={16} />} />
              <StatCard label="Packet capture" value={capture.running ? 'Running' : 'Stopped'} detail={`Interface: ${capture.interface || 'Not reported'}`} icon={<ShieldCheck size={19} />} tone={capture.running ? 'green' : 'orange'} trend={<Activity size={16} />} />
              <StatCard label="Refresh interval" value="3 seconds" detail="Automatic dashboard refresh" icon={<Clock3 size={19} />} tone="blue" trend={<RefreshCw size={16} />} />
              <StatCard label="Packets loaded" value={packets.length.toLocaleString()} detail="Currently available in the dashboard" icon={<Gauge size={19} />} tone="purple" trend={<ArrowUpRight size={16} />} />
            </div>
            <section className="dashboard-card packet-card">
              <div className="section-heading"><div><h2>Capture controls</h2><p>Start or stop packet capture using the existing backend</p></div><ShieldCheck size={19} /></div>
              <div className="settings-row">
                <div><strong>Live packet capture</strong><p className="page-description">{capture.running ? 'Capture is currently active.' : 'Capture is currently stopped.'}</p></div>
                <div className="settings-actions">
                  <button type="button" className="primary-button" disabled={actionLoading || capture.running} onClick={() => void startCaptureHandler()}><Play size={16} />Start</button>
                  <button type="button" className="secondary-button" disabled={actionLoading || !capture.running} onClick={() => void stopCaptureHandler()}><Square size={16} />Stop</button>
                </div>
              </div>
            </section>
            <section className="dashboard-card packet-card">
              <div className="section-heading"><div><h2>Dashboard information</h2><p>Current application status</p></div><Settings size={19} /></div>
              <div className="protocol-list">
                <SettingRow label="Backend API" value="http://127.0.0.1:8000" />
                <SettingRow label="Frontend development server" value="http://localhost:5173" />
                <SettingRow label="Last successful refresh" value={lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not available'} />
                <SettingRow label="Automatic refresh" value="Every 3 seconds" />
              </div>
              <p className="page-description">These values describe the current development setup. This page does not modify operating-system settings.</p>
            </section>
          </section>
        )}

        <footer className="app-footer"><span>NetMirror · Network Traffic Analyzer</span><span>Local monitoring dashboard</span></footer>
      </main>
    </div>
  )
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow:string; title:string; description:string; children?:ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}<span>.</span></h1><p className="page-description">{description}</p></div>{children && <div className="capture-actions">{children}</div>}</div>
}

function CaptureButton({ running, busy, onStart, onStop }: { running:boolean; busy:boolean; onStart:()=>void; onStop:()=>void }) {
  return !running ? (
    <button type="button" className="primary-button" disabled={busy} onClick={onStart}><Play size={16} />{busy ? 'Starting...' : 'Start capture'}</button>
  ) : (
    <button type="button" className="danger-button" disabled={busy} onClick={onStop}><Square size={15} />{busy ? 'Stopping...' : 'Stop capture'}</button>
  )
}

function CaptureBanner({ capture }: { capture:CaptureStatus }) {
  return <div className="capture-banner">
    <div className="capture-banner-icon"><Wifi size={21} /></div>
    <div className="capture-banner-copy">
      <strong>{capture.running ? 'Live packet capture is running' : 'Ready to monitor your network'}</strong>
      <span>Interface: {capture.interface} · {capture.running ? `${capture.captured_since_start.toLocaleString()} packets captured this session` : 'Start a capture to collect live traffic'}</span>
    </div>
    <span className={`capture-badge ${capture.running ? 'capturing' : ''}`}><span className="status-dot" />{capture.running ? 'CAPTURING' : 'IDLE'}</span>
  </div>
}

function ProtocolDistribution({ stats, loading, showBytes=false }: { stats:NetworkStats; loading:boolean; showBytes?:boolean }) {
  return <section className="dashboard-card protocol-card">
    <div className="section-heading"><div><h2>Protocol distribution</h2><p>{showBytes ? 'Compare protocol counts and recorded data' : 'Breakdown of recorded network traffic'}</p></div><Network size={19} /></div>
    {stats.protocols.length > 0 ? <div className="protocol-list">
      {stats.protocols.slice().sort((a,b) => b.packet_count-a.packet_count).map((protocol,index) => {
        const percentage = stats.total_packets > 0 ? protocol.packet_count / stats.total_packets * 100 : 0
        const color = chartColors[index % chartColors.length]
        return <div className="protocol-row" key={protocol.protocol}>
          <div className="protocol-row-top"><span className="protocol-name"><span className="protocol-color" style={{backgroundColor:color}} />{protocol.protocol}</span><span className="protocol-count">{protocol.packet_count.toLocaleString()} <span>({percentage.toFixed(1)}%)</span></span></div>
          <div className="protocol-track"><div className="protocol-fill" style={{width:`${Math.min(percentage,100)}%`,backgroundColor:color}} /></div>
          {showBytes && <div className="activity-metric"><span>Recorded data</span><strong>{formatBytes(protocol.total_bytes)}</strong></div>}
        </div>
      })}
    </div> : <div className="empty-table">{loading ? 'Loading protocol statistics...' : 'No protocol data available yet.'}</div>}
  </section>
}

function CaptureStatusCard({ capture, lastUpdated }: { capture:CaptureStatus; lastUpdated:Date|null }) {
  return <section className="dashboard-card activity-card">
    <div className="section-heading"><div><h2>Capture status</h2><p>Current monitoring session</p></div><Activity size={19} /></div>
    <div className="activity-status"><div className={`activity-status-icon ${capture.running ? 'active' : ''}`}>{capture.running ? <Activity size={25} /> : <Wifi size={25} />}</div><h3>{capture.running ? 'Monitoring traffic' : 'Capture is idle'}</h3><p>{capture.running ? 'Packets are being collected from your selected interface.' : 'Start capture to begin collecting live packets.'}</p></div>
    <div className="activity-metric"><span>Interface</span><strong>{capture.interface}</strong></div>
    <div className="activity-metric"><span>Session packets</span><strong>{capture.captured_since_start.toLocaleString()}</strong></div>
    <div className="activity-metric"><span>Last refreshed</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</strong></div>
    {capture.errors.length > 0 && <div className="capture-error"><strong>Capture warning</strong><p>{capture.errors[capture.errors.length-1]}</p></div>}
  </section>
}

function Indicator({ title, count, description }: { title:string; count:number; description:string }) {
  return <div className="protocol-row"><div className="protocol-row-top"><span className="protocol-name">{title}</span><span className="protocol-count">{count}</span></div><p className="page-description">{description}</p></div>
}

function SettingRow({ label, value }: { label:string; value:string }) {
  return <div className="settings-row"><span>{label}</span><strong>{value}</strong></div>
}

function PacketTable({ packets, allPackets, search, setSearch, protocolFilter, setProtocolFilter, protocols, currentPage, totalPages, setCurrentPage, loading, apiError }: {
  packets:Packet[]; allPackets:Packet[]; search:string; setSearch:(value:string)=>void;
  protocolFilter:string; setProtocolFilter:(value:string)=>void; protocols:string[];
  currentPage:number; totalPages:number; setCurrentPage:(value:number)=>void;
  loading:boolean; apiError:string;
}) {
  return <section className="dashboard-card packet-card">
    <div className="section-heading packet-heading"><div><h2>Recent packets</h2><p>Inspect the latest packets recorded by the analyzer</p></div><span className="packet-total">{allPackets.length} records</span></div>
    <div className="packet-toolbar">
      <div className="search-box"><Search size={17} /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search IP, protocol, port..." aria-label="Search packets" />{search && <button type="button" className="clear-search" onClick={()=>setSearch('')} aria-label="Clear search"><X size={15}/></button>}</div>
      <select value={protocolFilter} onChange={e=>setProtocolFilter(e.target.value)} aria-label="Filter by protocol"><option value="All">All protocols</option>{protocols.map(p=><option value={p} key={p}>{p}</option>)}</select>
    </div>
    <div className="packet-table-wrap"><table className="packet-table">
      <thead><tr><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Length</th></tr></thead>
      <tbody>{packets.map(packet=><tr key={packet.id}>
        <td className="muted">{formatTimestamp(packet.timestamp)}</td>
        <td><span className="ip-address">{packet.src_ip || '—'}</span>{packet.src_port != null && <span className="port-label">:{packet.src_port}</span>}</td>
        <td><span className="ip-address">{packet.dst_ip || '—'}</span>{packet.dst_port != null && <span className="port-label">:{packet.dst_port}</span>}</td>
        <td><span className={`protocol-badge protocol-${packet.protocol.toLowerCase()}`}>{packet.protocol}</span></td>
        <td>{formatBytes(packet.packet_size)}</td>
      </tr>)}</tbody>
    </table></div>
    {packets.length > 0 ? <div className="pagination"><span className="muted">Page {currentPage} of {totalPages}</span><div style={{display:'flex',gap:8}}>
      <button type="button" className="secondary-button" disabled={currentPage<=1} onClick={()=>setCurrentPage(currentPage-1)}><ChevronLeft size={16}/>Previous</button>
      <button type="button" className="secondary-button" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(currentPage+1)}>Next<ChevronRight size={16}/></button>
    </div></div> : <div className="empty-table"><div className="empty-icon small-empty-icon"><Activity size={21}/></div><span>{apiError ? 'Could not load packet records.' : loading ? 'Loading packet records...' : 'No packet records match your filters.'}</span></div>}
  </section>
}

function StatCard({ label, value, detail, icon, tone, trend }: { label:string; value:string; detail:string; icon:ReactNode; tone:string; trend:ReactNode }) {
  return <article className="dashboard-card stat-card"><div className="stat-topline"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-trend">{trend}</span></div><p className="stat-label">{label}</p><div className="stat-value">{value}</div><p className="stat-detail">{detail}</p></article>
}

function formatTimestamp(value:string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString()
}

function formatBytes(value:number) {
  if (!Number.isFinite(value) || value<=0) return '0 B'
  if (value<1024) return `${value} B`
  if (value<1024*1024) return `${(value/1024).toFixed(1)} KB`
  return `${(value/(1024*1024)).toFixed(2)} MB`
}

export default App
