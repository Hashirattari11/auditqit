'use client'
import { useEffect, useState, useRef } from 'react'

const STEPS = [
  { id: 'fetch',       label: 'Fetching page content',      icon: '🌐' },
  { id: 'security',    label: 'Checking security headers',   icon: '🔒' },
  { id: 'seo',         label: 'Analyzing SEO',               icon: '🔍' },
  { id: 'links',       label: 'Scanning links',              icon: '🔗' },
  { id: 'performance', label: 'Running performance audit',   icon: '⚡' },
  { id: 'errors',      label: 'Checking for JS errors',      icon: '🐛' },
  { id: 'ai',          label: 'Generating AI analysis',      icon: '🤖' },
]

interface AuditStatus {
  id: string
  url: string
  status: string
  currentStep: string | null
}

export default function AuditProgress({
  auditId,
  onRerun,
}: {
  auditId: string
  onRerun?: () => void
}) {
  const [audit, setAudit] = useState<AuditStatus | null>(null)
  const pollCount = useRef(0)
  const MAX_POLLS = 90 // 90 x 2s = 3 minutes max

  useEffect(() => {
    if (!auditId) return

    const pollInterval = setInterval(async () => {
      pollCount.current++

      if (pollCount.current >= MAX_POLLS) {
        clearInterval(pollInterval)
        setAudit((prev) => prev ? { ...prev, status: 'failed', currentStep: '' } : prev)
        return
      }

      try {
        const response = await fetch(`/api/audit/${auditId}/status`)
        if (!response.ok) throw new Error('API error')
        const data = await response.json()
        setAudit(data)

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval)
        }
      } catch {
        // Don't stop polling on single error — keep trying
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [auditId])

  if (!audit) {
    return (
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="animate-spin h-5 w-5 border-2 border-accent-blue border-t-transparent rounded-full" />
        <span>Connecting to audit engine...</span>
      </div>
    )
  }

  if (audit.status === 'completed') {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-green mb-2">Audit Complete!</div>
        <div className="text-text-muted">Loading results...</div>
      </div>
    )
  }

  if (audit.status === 'failed') {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-red mb-2">Audit Failed</div>
        <div className="text-text-muted">{audit.currentStep || 'An unexpected error occurred.'}</div>
        {onRerun && (
          <button
            onClick={onRerun}
            className="mt-4 px-6 py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Re-run Audit
          </button>
        )}
      </div>
    )
  }

  const currentStepKey = audit.currentStep || ''
  const currentIndex = STEPS.findIndex((s) => s.id === currentStepKey)

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex || audit.status === 'completed'
        const isActive = step.id === currentStepKey && audit.status === 'running'
        const isPending = index > currentIndex && audit.status !== 'completed'

        return (
          <div
            key={step.id}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all duration-500
              ${isDone    ? 'border-green-500/50 bg-green-500/10'  : ''}
              ${isActive  ? 'border-indigo-500/50 bg-indigo-500/10 animate-pulse' : ''}
              ${isPending ? 'border-white/10 bg-white/5 opacity-50' : ''}
            `}
          >
            {/* Status indicator */}
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              transition-all duration-500
              ${isDone    ? 'bg-green-500 text-white'   : ''}
              ${isActive  ? 'bg-indigo-500 text-white'  : ''}
              ${isPending ? 'bg-white/20 text-white/40' : ''}
            `}>
              {isDone   ? '✓' : ''}
              {isActive ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : ''}
              {isPending ? '○' : ''}
            </div>

            {/* Label */}
            <span className={`
              text-sm font-medium transition-all duration-300
              ${isDone    ? 'text-green-400' : ''}
              ${isActive  ? 'text-indigo-300' : ''}
              ${isPending ? 'text-white/30'  : ''}
            `}>
              {step.icon} {step.label}
            </span>

            {/* Done checkmark animation */}
            {isDone && (
              <span className="ml-auto text-green-400 text-sm animate-[fadeIn_0.3s_ease]">
                Done
              </span>
            )}
            {isActive && (
              <span className="ml-auto text-indigo-300 text-xs">
                Running...
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
