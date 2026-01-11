'use client'

import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

// --- Interfaces ---

interface PhoneLinkFormProps {
  agentId: number
  phoneNumbers: PhoneNumber[]
  onLink: (agentId: number, phoneIds: number[]) => void
  onCancel: () => void
}

interface AIAgent {
  id: number
  user_id: number
  agent_name: string
  system_prompt: string
  language: string
  voice_name: string | null
  is_active: boolean
  configuration: {
    flow_steps: { id: string, name: string, content: string }[]
    background_audio: { enabled: boolean, type: string }
    call_transfer: { enabled: boolean, number: string }
    behavior: { filler_phrases: boolean, personality: string }
    knowledge: { documents: string[], website: string }
    integrations: any[]
    post_call: { delivery: string, summary: boolean, transcript: boolean, sentiment: boolean, extraction: boolean, extracted_data: any[] }
  }
  created_at: string
  updated_at: string
}

interface PhoneNumber {
  id: number
  number: string
}

// --- Sub-Components ---

function PhoneLinkForm({ agentId, phoneNumbers, onLink, onCancel }: PhoneLinkFormProps) {
  const [selectedPhones, setSelectedPhones] = useState<number[]>([])

  const handleCheckboxChange = (phoneId: number, checked: boolean) => {
    if (checked) {
      setSelectedPhones([...selectedPhones, phoneId])
    } else {
      setSelectedPhones(selectedPhones.filter((id) => id !== phoneId))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLink(agentId, selectedPhones)
  }

  return (
    <div className="mt-4 p-5 bg-[#121a1e] rounded-xl border border-[#1a2126] animate-fadeIn">
      <p className="text-sm font-semibold text-white mb-4">Link Phone Numbers:</p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {phoneNumbers.map((phone) => (
            <label key={phone.id} className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
              <input
                type="checkbox"
                value={phone.id}
                checked={selectedPhones.includes(phone.id)}
                onChange={(e) => handleCheckboxChange(phone.id, e.target.checked)}
                className="h-5 w-5 text-[#5e9cb9] focus:ring-[#5e9cb9] border-[#1a2126] rounded bg-[#0b1114] transition-all"
              />
              <span className="ml-3 text-sm font-medium text-[#8a99a8] group-hover:text-white transition-colors">{phone.number}</span>
            </label>
          ))}
          {phoneNumbers.length === 0 && (
            <p className="text-sm text-[#8a99a8] italic">No phone numbers available.</p>
          )}
        </div>
        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={phoneNumbers.length === 0}
            className="flex-1 bg-[#5e9cb9] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#4d8aa8] shadow-lg shadow-[#5e9cb9]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Link Selected
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-[#1a2126] text-[#8a99a8] border border-[#2d383f] rounded-lg text-sm font-bold hover:text-white hover:bg-[#2d383f] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// --- Main Page Component ---

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)

  // Advanced Config State
  const [activeTab, setActiveTab] = useState('details')
  const [formData, setFormData] = useState({
    id: null as number | null,
    agent_name: '',
    system_prompt: '',
    language: 'en',
    voice_name: 'en-US-AriaNeural',
    is_active: true,
    configuration: {
      flow_steps: [] as { id: string, name: string, content: string }[],
      background_audio: { enabled: false, type: 'office' },
      call_transfer: { enabled: false, number: '' },
      behavior: { filler_phrases: false, personality: 'professional' },
      knowledge: { documents: [] as string[], website: '' },
      integrations: [] as any[],
      post_call: { delivery: 'email', summary: false, transcript: false, sentiment: false, extraction: false, extracted_data: [] as any[] }
    }
  })

  const [error, setError] = useState('')
  const [helperInput, setHelperInput] = useState('')
  const [helperMessages, setHelperMessages] = useState([
    { role: 'assistant', text: "I'm monitoring your configuration. Your current prompt setup is optimized for low-latency responses." }
  ])

  const [isLive, setIsLive] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const audioContext = React.useRef<AudioContext | null>(null)
  const mediaRecorder = React.useRef<MediaRecorder | null>(null)

  const handleLiveLink = async () => {
    if (isLive) {
      socket?.close()
      mediaRecorder.current?.stop()
      setIsLive(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
      const ws = new WebSocket(`${wsUrl}/api/v1/ws/agent/${formData.id}`)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        setIsLive(true)
        console.log('Voice Uplink Active')

        // Start recording and streaming chunks
        mediaRecorder.current = new MediaRecorder(stream)
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data)
          }
        }
        mediaRecorder.current.start(1000) // Stream in 1-second chunks
      }

      ws.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data)
          if (msg.type === 'transcript') {
            setHelperMessages(prev => [...prev, { role: msg.role, text: msg.text }])
          }
        } else {
          playAudioChunk(event.data)
        }
      }

      ws.onclose = () => {
        setIsLive(false)
        mediaRecorder.current?.stop()
      }
      setSocket(ws)
    } catch (err) {
      console.error('Microphone access denied', err)
      alert('Please allow microphone access to test the agent.')
    }
  }

  const playAudioChunk = async (data: ArrayBuffer) => {
    try {
      if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buffer = await audioContext.current.decodeAudioData(data)
      const source = audioContext.current.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.current.destination)
      source.start()
    } catch (e) {
      console.error('Audio playback error', e)
    }
  }

  const handleSendMessage = async () => {
    if (!helperInput.trim() || !formData.id) return

    const userMessage = helperInput.trim()
    setHelperInput('')

    // Add user message to chat
    setHelperMessages(prev => [...prev, { role: 'user', text: userMessage }])

    try {
      // Call backend AI endpoint
      const response = await apiClient.post(`/ai-agents/${formData.id}/chat`, {
        message: userMessage
      })

      // Add AI response to chat
      setHelperMessages(prev => [...prev, {
        role: 'assistant',
        text: response.data.response || 'No response from agent.'
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setHelperMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Error: Could not connect to agent. Please check your configuration.'
      }])
    }
  }

  useEffect(() => {
    if (showConfigModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      socket?.close()
    }
  }, [showConfigModal])

  useEffect(() => {
    fetchAgents()
    fetchPhoneNumbers()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get('/ai-agents')
      setAgents(response.data)
    } catch (error) {
      console.error('Failed to fetch AI agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhoneNumbers = async () => {
    try {
      const response = await apiClient.get('/phone-numbers')
      setPhoneNumbers(response.data)
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error)
    }
  }

  const handleOpenCreate = (initialPrompt = '') => {
    setFormData({
      id: null,
      agent_name: '',
      system_prompt: initialPrompt,
      language: 'en',
      voice_name: 'en-US-AriaNeural',
      is_active: true,
      configuration: {
        flow_steps: [
          { id: '1', name: 'Greeting', content: 'Hello! How can I help you today?' }
        ],
        background_audio: { enabled: false, type: 'office' },
        call_transfer: { enabled: false, number: '' },
        behavior: { filler_phrases: false, personality: 'professional' },
        knowledge: { documents: [], website: '' },
        integrations: [],
        post_call: { delivery: 'email', summary: false, transcript: false, sentiment: false, extraction: false, extracted_data: [] }
      }
    })
    setShowConfigModal(true)
  }

  const handleEditAgent = (agent: AIAgent) => {
    setFormData({
      id: agent.id,
      agent_name: agent.agent_name,
      system_prompt: agent.system_prompt,
      language: agent.language,
      voice_name: agent.voice_name || 'en-US-AriaNeural',
      is_active: agent.is_active,
      configuration: agent.configuration || {
        flow_steps: [],
        background_audio: { enabled: false, type: 'office' },
        call_transfer: { enabled: false, number: '' },
        behavior: { filler_phrases: false, personality: 'professional' },
        knowledge: { documents: [], website: '' },
        integrations: [],
        post_call: { delivery: 'email', summary: false, transcript: false, sentiment: false, extraction: false, extracted_data: [] }
      }
    })
    setShowConfigModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsDeploying(true)

    try {
      const payload = {
        agent_name: formData.agent_name,
        system_prompt: formData.system_prompt,
        language: formData.language,
        voice_name: formData.voice_name,
        is_active: true,
        configuration: formData.configuration
      }

      if (formData.id) {
        await apiClient.put(`/ai-agents/${formData.id}`, payload)
      } else {
        await apiClient.post('/ai-agents', payload)
      }

      // Simulation for SaaS "Deployment" feel
      setTimeout(() => {
        setIsDeploying(false)
        setShowConfigModal(false)
        fetchAgents()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Deployment failed. Check infrastructure status.')
      setIsDeploying(false)
    }
  }



  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this AI agent?')) return

    try {
      await apiClient.delete(`/ai-agents/${id}`)
      fetchAgents()
    } catch (error) {
      console.error('Failed to delete AI agent:', error)
      alert('Failed to delete AI agent')
    }
  }

  const toggleActive = async (agent: AIAgent) => {
    try {
      await apiClient.put(`/ai-agents/${agent.id}`, {
        is_active: !agent.is_active,
      })
      fetchAgents()
    } catch (error) {
      console.error('Failed to update AI agent:', error)
    }
  }

  const handleLinkPhones = async (agentId: number, phoneIds: number[]) => {
    try {
      await apiClient.post(`/ai-agents/${agentId}/link-phones`, {
        phone_number_ids: phoneIds,
      })
      alert('Phone numbers linked successfully')
      setSelectedAgent(null)
    } catch (error) {
      console.error('Failed to link phone numbers:', error)
      alert('Failed to link phone numbers')
    }
  }

  const handleHelperSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!helperInput.trim()) return

    const newMsgs = [...helperMessages, { role: 'user', text: helperInput }]
    setHelperMessages(newMsgs)
    setHelperInput('')

    // Simulated AI Response
    setTimeout(() => {
      setHelperMessages([...newMsgs, { role: 'assistant', text: "I've analyzed your input. I'm updating the logic sequences to match your request." }])
    }, 1000)
  }

  // --- Test Logic ---
  const [testInput, setTestInput] = useState('')
  const [testAudioSrc, setTestAudioSrc] = useState<string | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const handleTestAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testInput.trim()) return

    setIsTestLoading(true)
    setTestAudioSrc(null)

    try {
      const response = await apiClient.post('/test-ai/speak', {
        user_input: testInput,
        system_prompt: formData.system_prompt
      }, {
        responseType: 'blob'
      })

      const audioUrl = URL.createObjectURL(response.data)
      setTestAudioSrc(audioUrl)
    } catch (error) {
      console.error('Failed to test agent:', error)
      alert('Failed to generate audio response.')
    } finally {
      setIsTestLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        {/* --- Premium Omni-Inspired Hero Section --- */}
        <div className="relative group max-w-5xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#5e9cb9] to-blue-600 rounded-[40px] blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
          <div className="relative bg-[#0b1114] border border-[#1a2126] rounded-[36px] p-10 md:p-16 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5e9cb9]/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                  Build <span className="text-[#5e9cb9]">Smarter</span> <br />Voice Agents.
                </h1>
                <p className="text-[#8a99a8] text-xl font-medium max-w-xl leading-relaxed">
                  Transform your ideas into high-performance AI assistants in seconds.
                </p>
              </div>

              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1a2126] to-[#2d383f] rounded-3xl opacity-50 group-focus-within/input:from-[#5e9cb9]/30 transition-all"></div>
                <textarea
                  className="relative w-full bg-[#05080a] border border-[#1a2126] rounded-3xl p-8 text-white text-xl focus:ring-0 focus:border-[#5e9cb9]/50 transition-all min-h-[180px] placeholder-gray-800 shadow-2xl outline-none leading-relaxed font-medium"
                  placeholder="Describe your agent's purpose (e.g., A dental clinic receptionist)..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />

                <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (!testInput.trim()) return;
                      setIsTestLoading(true);
                      setTimeout(() => {
                        const baseInput = testInput.trim();
                        setTestInput(`Role: Professional ${baseInput}\n\nObjective: Provide exceptional support and clarify user needs.\nTone: Empathetic, clear, and efficient.\n\nInstructions:\n- Greet with warmth.\n- Identify key user requirements.\n- Offer specific solutions based on context.`);
                        setIsTestLoading(false);
                      }, 1200);
                    }}
                    className="flex items-center gap-2 px-6 py-4 bg-[#1a2126] text-[#8a99a8] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-[#2d383f] transition-all border border-[#2d383f] group/enhance"
                  >
                    {isTestLoading ? (
                      <div className="w-3 h-3 border-2 border-[#5e9cb9] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="group-hover/enhance:scale-125 transition-transform">✨</span>
                    )}
                    Enhance
                  </button>
                  <button
                    onClick={() => handleOpenCreate(testInput)}
                    className="flex items-center gap-3 px-10 py-4 bg-[#5e9cb9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] transition-all shadow-2xl shadow-[#5e9cb9]/40 transform active:scale-95"
                  >
                    Create Agent
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#1a2126] pb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Your Assistants</h2>
            <div className="bg-[#1a2126] px-3 py-1 rounded-lg text-[#8a99a8] text-xs font-bold">{agents.length}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#1a2126] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#5e9cb9] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-[#8a99a8] font-bold tracking-widest uppercase text-xs">Syncing Agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div
            className="bg-[#0b1114] border-2 border-dashed border-[#1a2126] rounded-2xl p-20 text-center hover:border-[#5e9cb9]/50 transition-all group cursor-pointer"
            onClick={() => handleOpenCreate()}
          >
            <div className="mx-auto h-20 w-20 bg-[#121a1e] rounded-2xl flex items-center justify-center text-[#8a99a8] group-hover:text-[#5e9cb9] transition-colors mb-6 border border-[#1a2126] group-hover:border-[#5e9cb9]/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No agents defined</h3>
            <p className="text-[#8a99a8]">Get started by creating your first AI personality.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div key={agent.id} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5e9cb9] to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-[#0b1114] bg-opacity-80 backdrop-blur-xl overflow-hidden rounded-2xl border border-[#1a2126] group-hover:border-[#5e9cb9]/40 transition-all duration-300 flex flex-col h-full shadow-2xl">
                  <div className="p-6 border-b border-[#1a2126] bg-[#0b1114]/30 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white truncate tracking-tight">{agent.agent_name}</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-[#5e9cb9] shadow-[0_0_8px_#5e9cb9]' : 'bg-[#1a2126]'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8a99a8]">{agent.is_active ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="text-[9px] font-black text-[#5e9cb9] uppercase tracking-[0.2em] mb-2">System Identity</div>
                      <p className="text-xs text-[#8a99a8] line-clamp-2 leading-relaxed italic border-l-2 border-[#1a2126] pl-3">"{agent.system_prompt}"</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[#5e9cb9]/60 mb-4">
                      <span>Engine: GPT-4o</span>
                      <span>Voice: Aria Neural</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="px-3 py-2.5 bg-[#5e9cb9] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] shadow-xl shadow-[#5e9cb9]/10 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="px-3 py-2.5 bg-[#1a2126] text-[#8a99a8] border border-[#2d383f] rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                        className={`w-full justify-center inline-flex items-center px-4 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAgent === agent.id
                          ? 'bg-white/5 text-white border-[#5e9cb9]/40'
                          : 'bg-transparent text-[#8a99a8] border-[#1a2126] hover:text-white hover:bg-[#121a1e]'
                          }`}
                      >
                        <svg className={`mr-2 h-3.5 w-3.5 transition-transform ${selectedAgent === agent.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11l-7 7-7-7" />
                        </svg>
                        {selectedAgent === agent.id ? 'Close Direct Numbers' : 'Direct Numbers'}
                      </button>
                      {selectedAgent === agent.id && (
                        <div className="animate-fadeIn mt-2">
                          <PhoneLinkForm
                            agentId={agent.id}
                            phoneNumbers={phoneNumbers}
                            onLink={handleLinkPhones}
                            onCancel={() => setSelectedAgent(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Configuration Modal (TRUE FULL SCREEN OVERLAY) --- */}
        {showConfigModal && (
          <div className="fixed inset-0 z-[100] bg-[#05080a] flex flex-col animate-fadeIn overflow-hidden" role="dialog" aria-modal="true">
            {/* Main Application Container */}
            <div className="h-full flex flex-row overflow-hidden">

              {/* Sidebar Helper Assistant (Persistent Column) */}
              <div className="w-[340px] flex-shrink-0 border-r border-[#1a2126] bg-[#0b1114]/50 flex flex-col hidden lg:flex">
                <div className="p-8 border-b border-[#1a2126] bg-[#0b1114]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#5e9cb9] rounded-full blur-md opacity-40 animate-pulse"></div>
                      <div className="w-3 h-3 rounded-full bg-[#5e9cb9] relative z-10"></div>
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5e9cb9] font-heading">Co-Pilot Assistant</h3>
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {helperMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-[24px] text-[12px] leading-relaxed font-medium shadow-2xl border ${msg.role === 'user'
                        ? 'bg-[#5e9cb9] text-white border-white/10'
                        : 'bg-[#121a1e] text-[#8a99a8] border-[#1a2126]'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-8 border-t border-[#1a2126] bg-[#0b1114]">
                  <form onSubmit={handleHelperSend} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1a2126] to-[#2d383f] rounded-[20px] opacity-50 group-focus-within:opacity-100 group-focus-within:from-[#5e9cb9]/30 transition-all"></div>
                    <input
                      type="text"
                      placeholder="Ask the co-pilot to refine logic..."
                      className="relative w-full bg-[#05080a] border border-[#1a2126] rounded-[20px] px-6 py-5 text-xs text-white focus:ring-0 focus:border-[#5e9cb9]/50 outline-none transition-all placeholder-gray-800 font-medium"
                      value={helperInput}
                      onChange={(e) => setHelperInput(e.target.value)}
                    />
                    <button type="submit" className="absolute right-4 top-4.5 p-1.5 text-[#5e9cb9] hover:scale-125 transition-all">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                  </form>
                </div>
              </div>

              {/* Central Editor Area */}
              <div className="flex-1 flex flex-col bg-[#05080a] relative overflow-hidden">
                {/* Immersive Header */}
                <div className="py-6 px-10 border-b border-[#1a2126] flex items-center justify-between bg-[#0b1114]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-white tracking-tighter font-heading uppercase">{formData.agent_name || 'System Identity'}</h2>
                      <div className="px-2 py-0.5 bg-[#5e9cb9]/10 text-[#5e9cb9] text-[8px] font-black rounded-md border border-[#5e9cb9]/20 uppercase tracking-[0.2em]">Build Core v1.4.0</div>
                    </div>
                    <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]"></span> RUNNING_STABLE
                      </span>
                      <span className="text-[#8a99a8]">NETWORK: <span className="text-white">EDGESCALE_GLOBAL</span></span>
                      <span className="text-[#8a99a8]">LLM: <span className="text-white">GPT-4O_TURBO_LATEST</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-[#05080a] p-1 rounded-xl flex border border-[#1a2126] shadow-2xl">
                      <button onClick={() => setActiveTab('details')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab !== 'code' ? 'bg-[#5e9cb9] text-white shadow-xl shadow-[#5e9cb9]/20' : 'text-[#8a99a8] hover:text-white'}`}>Visual Engine</button>
                      <button onClick={() => setActiveTab('code')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'code' ? 'bg-[#5e9cb9] text-white shadow-xl shadow-[#5e9cb9]/20' : 'text-[#8a99a8] hover:text-white'}`}>Logic Source</button>
                    </div>
                    <button onClick={() => setShowConfigModal(false)} className="w-10 h-10 flex items-center justify-center bg-[#1a2126] rounded-xl text-[#8a99a8] hover:text-white transition-all border border-[#2d383f] hover:border-[#5e9cb9]/50 shadow-2xl">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Sub Navigation (Horizontal) */}
                <div className="px-10 bg-[#0b1114] border-b border-[#1a2126] flex gap-8">
                  {['DETAILS', 'STYLING', 'KNOWLEDGE', 'CHANNELS', 'POST-CALL', 'PLAYGROUND', 'GUIDE'].map((label) => {
                    const tabMap: Record<string, string> = {
                      'DETAILS': 'details', 'STYLING': 'settings', 'KNOWLEDGE': 'knowledge_base',
                      'CHANNELS': 'integrations', 'POST-CALL': 'post-call', 'PLAYGROUND': 'test',
                      'GUIDE': 'guide'
                    };
                    const tab = tabMap[label];
                    const isActive = activeTab === tab;
                    return (
                      <button key={label} onClick={() => setActiveTab(tab)} className={`py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative ${isActive ? 'text-[#5e9cb9]' : 'text-[#8a99a8] hover:text-white'}`}>
                        {label}
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5e9cb9] shadow-[0_0_20px_#5e9cb9]"></div>}
                      </button>
                    )
                  })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16">
                  {/* Tabs Content Injection Point */}
                  {/* 1. Details Tab */}
                  {activeTab === 'details' && (
                    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
                      <div className="grid grid-cols-4 gap-6">
                        {[
                          { l: 'PLATFORM', v: 'NEURAL_EDGE_V3', i: '🌐' },
                          { l: 'VOICE_CORE', v: 'ELEVEN_TURBO_2', i: '🎙️' },
                          { l: 'CONTEXT_WINDOW', v: '128K_TOKENS', i: '🧠' },
                          { l: 'LATENCY_MODE', v: 'ULTRA_LOW', i: '⚡' },
                        ].map(c => (
                          <div key={c.l} className="bg-[#121a1e]/40 border border-[#1a2126] p-6 rounded-[24px] hover:border-[#5e9cb9]/40 transition-all group relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-3 opacity-5 text-4xl transform translate-x-2 -translate-y-2">{c.i}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#5e9cb9] mb-2">{c.l}</div>
                            <div className="text-xs font-black text-white group-hover:tracking-wider transition-all">{c.v}</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white font-heading">Base System Prompt</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-[#8a99a8] uppercase tracking-widest">Dynamic Sync</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-10 h-5 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_20px_rgba(94,156,185,0.4)] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                          </div>
                        </div>
                        <textarea
                          className="w-full bg-[#0b1114] border border-[#1a2126] rounded-[24px] p-8 text-sm text-white focus:ring-1 focus:ring-[#5e9cb9]/40 placeholder-gray-800 resize-none h-40 outline-none font-medium leading-relaxed shadow-3xl transition-all"
                          value={formData.system_prompt}
                          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                        />
                      </div>

                      <div className="space-y-8 pb-10">
                        <div className="flex items-center justify-between bg-[#0b1114] p-6 rounded-[24px] border border-[#1a2126] shadow-2xl">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Conversational Matrix</h3>
                            <p className="text-[9px] text-[#8a99a8] font-black uppercase tracking-widest">Define automated logic sequences</p>
                          </div>
                          <button onClick={() => setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: [...formData.configuration.flow_steps, { id: Date.now().toString(), name: 'NEW_STEP', content: '' }] } })} className="px-6 py-3 bg-[#5e9cb9] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#5e9cb9]/40 hover:scale-105 transition-all">Add Logic Vector</button>
                        </div>

                        <div className="space-y-6 relative">
                          <div className="absolute left-[30px] top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-[#1a2126] via-[#2d383f] to-[#1a2126] opacity-30"></div>
                          {formData.configuration.flow_steps.map((step, idx) => (
                            <div key={step.id} className="relative z-10 pl-12 group">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#05080a] bg-[#1a2126] group-hover:bg-[#5e9cb9] transition-all shadow-xl group-hover:shadow-[0_0_15px_#5e9cb9] duration-500"></div>
                              <div className="bg-[#0b1114] border border-[#1a2126] rounded-[32px] overflow-hidden hover:border-[#5e9cb9]/30 transition-all shadow-3xl">
                                <div className="px-8 py-5 flex items-center justify-between border-b border-[#1a2126]/50 bg-[#121a1e]/40">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-[#5e9cb9]/15 rounded-xl flex items-center justify-center text-[#5e9cb9] font-black text-[9px] border border-[#5e9cb9]/20">{String(idx + 1).padStart(2, '0')}</div>
                                    <input
                                      className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 w-64 outline-none tracking-tight uppercase"
                                      value={step.name}
                                      onChange={(e) => {
                                        const n = [...formData.configuration.flow_steps]; n[idx].name = e.target.value;
                                        setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: n } });
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-5">
                                    <button onClick={() => {
                                      const n = formData.configuration.flow_steps.filter((_, i) => i !== idx);
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: n } });
                                    }} className="text-[#8a99a8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-black text-[9px] uppercase tracking-widest">Remove</button>
                                    <div className="w-[1px] h-5 bg-[#1a2126]"></div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" defaultChecked />
                                      <div className="w-9 h-4.5 bg-[#05080a] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_20px_rgba(94,156,185,0.3)] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-4.5 shadow-inner"></div>
                                    </label>
                                  </div>
                                </div>
                                <div className="p-8">
                                  <textarea
                                    className="w-full bg-transparent border-none p-0 text-base text-[#8a99a8] focus:ring-0 resize-none h-24 leading-relaxed outline-none font-medium italic placeholder-[#1a2126]"
                                    placeholder="Define logic behavior..."
                                    value={step.content}
                                    onChange={(e) => {
                                      const n = [...formData.configuration.flow_steps]; n[idx].content = e.target.value;
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: n } });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Settings Tab */}
                  {/* 2. Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-20">
                      <div className="bg-[#0b1114] p-16 rounded-[60px] border border-[#1a2126] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5e9cb9]/50 to-transparent"></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-12 border-l-8 border-[#5e9cb9] pl-10 underline decoration-[#5e9cb9]/30 underline-offset-8 font-heading">Neural Tuning</h3>
                        <div className="space-y-10">
                          {[
                            { t: 'Ambient Atmosphere', d: 'Synthetic background noise for hyper-realism.' },
                            { t: 'Enterprise Archiving', d: 'Military-grade encryption for call logging.' },
                            { t: 'Humanoid Filler Logic', d: 'Ultra-low latency verbal pauses and fillers.' }
                          ].map(item => (
                            <div key={item.t} className="flex items-center justify-between p-10 bg-[#05080a] rounded-[32px] border border-[#1a2126] hover:border-[#5e9cb9]/30 transition-all group scale-100 hover:scale-[1.02]">
                              <div className="space-y-2">
                                <div className="text-base font-black text-white tracking-tight">{item.t}</div>
                                <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-[0.2em]">{item.d}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer scale-125">
                                <input type="checkbox" className="sr-only peer" defaultChecked={item.t.includes('Archive')} />
                                <div className="w-14 h-7 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_25px_rgba(94,156,185,0.4)] after:content-[''] after:absolute after:top-[7px] after:left-[7px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Knowledge Base Tab */}
                  {activeTab === 'knowledge_base' && (
                    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn pb-20">
                      <div className="grid grid-cols-2 gap-10">
                        <div className="bg-[#121a1e]/60 p-16 rounded-[60px] border border-[#1a2126] flex flex-col items-center justify-center text-center space-y-10 hover:border-[#5e9cb9]/40 transition-all cursor-pointer group shadow-3xl">
                          <div className="w-24 h-24 bg-[#5e9cb9]/15 rounded-[32px] flex items-center justify-center text-[#5e9cb9] group-hover:scale-110 group-hover:bg-[#5e9cb9]/20 transition-all shadow-inner border border-[#5e9cb9]/20">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xl font-black text-white uppercase tracking-tighter">Synthetic Uplink</div>
                            <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-[0.3em]">PDF, TXT, DOCX ENGINE</div>
                          </div>
                        </div>
                        <div className="bg-[#121a1e]/60 p-16 rounded-[60px] border border-[#1a2126] flex flex-col items-center justify-center text-center space-y-10 hover:border-[#5e9cb9]/40 transition-all cursor-pointer group shadow-3xl">
                          <div className="w-24 h-24 bg-[#5e9cb9]/15 rounded-[32px] flex items-center justify-center text-[#5e9cb9] group-hover:scale-110 group-hover:bg-[#5e9cb9]/20 transition-all shadow-inner border border-[#5e9cb9]/20">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xl font-black text-white uppercase tracking-tighter">Web Ingress</div>
                            <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-[0.3em]">AUTO-SCRAPE & SYNC</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#05080a] p-16 rounded-[60px] border border-[#1a2126] shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5e9cb9]/5 rounded-full blur-[120px]"></div>
                        <div className="flex items-center justify-between mb-15 relative">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#5e9cb9] font-heading">Neural Context Matrix</h3>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-[#5e9cb9] uppercase tracking-widest bg-[#5e9cb9]/10 px-6 py-2 rounded-full border border-[#5e9cb9]/20">0.4 MB / 100 MB</span>
                          </div>
                        </div>
                        <div className="space-y-6 relative">
                          <div className="p-10 bg-[#0b1114] rounded-[32px] border border-[#1a2126] flex items-center justify-between group hover:border-[#5e9cb9]/30 transition-all shadow-3xl">
                            <div className="flex items-center gap-10">
                              <div className="w-16 h-16 bg-[#5e9cb9]/10 rounded-[20px] flex items-center justify-center text-[#5e9cb9] font-black text-xs border border-[#5e9cb9]/20">DAT</div>
                              <div className="space-y-1">
                                <div className="text-base font-black text-white tracking-tight">Core_Logic_Architecture.pdf</div>
                                <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-[0.2em]">SYNCED IN_VECTOR_EDGE</div>
                              </div>
                            </div>
                            <button className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">De-link</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Connectivity Tab */}
                  {activeTab === 'integrations' && (
                    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-32">
                      {[
                        { n: 'NEXUS_VOICE', s: 'STABLE', i: '📞', p: 'TELEPHONY' },
                        { n: 'CORTEX_GEN_4', s: 'ACTIVE', i: '🧠', p: 'NEURAL' },
                        { n: 'WEBHOOK_EDGE', s: 'WAITING', i: '🪝', p: 'WORKFLOW' }
                      ].map((int) => (
                        <div key={int.n} className="p-12 bg-[#0b1114] rounded-[50px] border border-[#1a2126] flex items-center justify-between hover:border-[#5e9cb9]/30 transition-all group shadow-3xl">
                          <div className="flex items-center gap-10">
                            <div className="w-24 h-24 bg-[#05080a] rounded-[32px] flex items-center justify-center text-4xl shadow-inner border border-[#1a2126] group-hover:border-[#5e9cb9]/20 transition-all">{int.i}</div>
                            <div className="space-y-2">
                              <div className="text-[11px] font-black uppercase tracking-[0.4em] text-[#5e9cb9]">{int.p}</div>
                              <div className="text-2xl font-black text-white tracking-tighter uppercase font-heading">{int.n}</div>
                              <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${int.s === 'STABLE' || int.s === 'ACTIVE' ? 'bg-green-400 shadow-[0_0_12px_#4ade80]' : 'bg-yellow-400 animate-pulse shadow-[0_0_12px_#facc15]'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8a99a8]">{int.s}_STATUS</span>
                              </div>
                            </div>
                          </div>
                          <button className="px-12 py-5 bg-[#05080a] text-white rounded-[24px] text-[11px] font-black border border-[#1a2126] hover:border-[#5e9cb9]/50 transition-all uppercase tracking-[0.3em] shadow-2xl">Re-auth Node</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 5. Post-Call Analysis Tab */}
                  {activeTab === 'post-call' && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-32">
                      <div className="bg-[#0b1114] p-16 rounded-[60px] border border-[#1a2126] shadow-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5e9cb9]/50 to-transparent"></div>
                        <h3 className="text-sm font-black text-[#5e9cb9] uppercase tracking-[0.4em] mb-15 border-l-8 border-[#5e9cb9] pl-10 font-heading">Data Extraction Engine</h3>
                        <div className="space-y-10">
                          {[
                            { l: 'Bullet Summary', d: 'Automated high-fidelity recap of call objectives.' },
                            { l: 'Sentiment Analysis', d: 'Neural detection of caller emotional trajectory.' },
                            { l: 'Deep Entity Extraction', d: 'Capture names, phones, and metadata vectors.' }
                          ].map((action) => (
                            <div key={action.l} className="flex items-center justify-between p-10 bg-[#05080a] rounded-[32px] border border-[#1a2126] hover:border-[#5e9cb9]/30 transition-all group cursor-pointer">
                              <div className="space-y-3">
                                <div className="text-base font-black text-white tracking-tight uppercase">{action.l}</div>
                                <div className="text-xs text-[#8a99a8] font-black uppercase tracking-widest leading-relaxed max-w-md">{action.d}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-14 h-7 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_25px_rgba(94,156,185,0.4)] after:content-[''] after:absolute after:top-[7px] after:left-[7px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Playground Tab - Text Chat */}
                  {activeTab === 'test' && (
                    <div className="h-full flex flex-col animate-fadeIn pb-8">
                      {/* Chat Messages Area */}
                      <div className="flex-1 overflow-y-auto space-y-6 mb-8 px-4">
                        {helperMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-6 rounded-3xl ${msg.role === 'user'
                              ? 'bg-[#5e9cb9] text-white'
                              : 'bg-[#0b1114] text-white border border-[#1a2126]'
                              }`}>
                              <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                                {msg.role === 'user' ? 'YOU' : 'AGENT'}
                              </div>
                              <div className="text-sm leading-relaxed">{msg.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input Area */}
                      <div className="border-t border-[#1a2126] pt-8 px-4">
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={helperInput}
                            onChange={(e) => setHelperInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && helperInput.trim()) {
                                handleSendMessage()
                              }
                            }}
                            placeholder="Type your message..."
                            className="flex-1 px-8 py-6 bg-[#0b1114] border border-[#1a2126] rounded-3xl text-white placeholder-[#8a99a8] focus:outline-none focus:border-[#5e9cb9] transition-all text-sm"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!helperInput.trim()}
                            className="px-12 py-6 bg-[#5e9cb9] text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-[#4d8aa8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-[#5e9cb9]/40"
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      {/* Voice Button (Commented for now) */}
                      {/* <div className="flex justify-center gap-8 mt-8">
                        <button
                          onClick={handleLiveLink}
                          className={`px-16 py-6 ${isLive ? 'bg-red-500 shadow-[0_20px_60px_rgba(239,68,68,0.4)]' : 'bg-[#5e9cb9] shadow-[0_20px_60px_rgba(94,156,185,0.4)]'} text-white rounded-[32px] text-[11px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all active:scale-95`}
                        >
                          {isLive ? 'Stop Voice' : 'Start Voice'}
                        </button>
                      </div> */}
                    </div>
                  )}

                  {/* 7. Guide Tab */}
                  {activeTab === 'guide' && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-32">
                      <div className="bg-[#0b1114] p-16 rounded-[60px] border border-[#1a2126] shadow-3xl">
                        <h3 className="text-sm font-black text-[#5e9cb9] uppercase tracking-[0.4em] mb-12 border-l-8 border-[#5e9cb9] pl-10 font-heading">Self-Hosted SaaS Infrastructure</h3>
                        <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <div className="text-xs font-black text-white uppercase tracking-widest">1. No External Frameworks</div>
                            <p className="text-xs text-[#8a99a8] leading-relaxed">System is built using 100% custom orchestration logic. No LangChain or AutoGPT dependencies, ensuring maximum speed and lower costs.</p>
                          </div>
                          <div className="space-y-6">
                            <div className="text-xs font-black text-white uppercase tracking-widest">2. Direct Voice Uplink</div>
                            <p className="text-xs text-[#8a99a8] leading-relaxed">Browser streaming sends audio directly to the edge-optimized brain core via WebSockets for sub-second latency.</p>
                          </div>
                          <div className="space-y-6">
                            <div className="text-xs font-black text-white uppercase tracking-widest">3. Memory Persistence</div>
                            <p className="text-xs text-[#8a99a8] leading-relaxed">User preferences and conversation history are managed locally, providing a persistent 'brain' for every user without extra costs.</p>
                          </div>
                          <div className="space-y-6">
                            <div className="text-xs font-black text-white uppercase tracking-widest">4. Scale-Ready Backend</div>
                            <p className="text-xs text-[#8a99a8] leading-relaxed">The Node/Python core handles concurrent sessions, making it ready to be white-labeled and sold as a global service.</p>
                          </div>
                        </div>
                        <div className="mt-16 p-8 bg-[#05080a] rounded-[32px] border border-[#1a2126]">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-[#5e9cb9]/15 rounded-2xl flex items-center justify-center text-[#5e9cb9]">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[10px] font-black text-white uppercase tracking-widest">Administrator Tip</div>
                              <div className="text-[9px] text-[#8a99a8] uppercase font-black tracking-widest">Use the 'Playground' tab to test real-time voice interaction before deploying to production.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Footer */}
                <div className="p-8 px-10 border-t border-[#1a2126] bg-[#0b1114] flex justify-end gap-6 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20">
                  <button onClick={() => setShowConfigModal(false)} className="px-10 py-4 text-[11px] font-black uppercase tracking-widest text-[#8a99a8] hover:text-white transition-colors">Discard Entities</button>
                  <button
                    onClick={handleSubmit}
                    disabled={isDeploying}
                    className={`px-12 py-4 ${isDeploying ? 'bg-[#1a2126] text-[#8a99a8]' : 'bg-[#5e9cb9] text-white shadow-2xl shadow-[#5e9cb9]/40 hover:bg-[#4d8aa8]'} rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-3`}
                  >
                    {isDeploying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#5e9cb9] border-t-transparent rounded-full animate-spin"></div>
                        Deploying System Core...
                      </>
                    ) : 'Deploy System Core'}
                  </button>
                </div>
              </div>
            </div >
            )
}
          </div >
    </Layout >
  )
}
