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

      setShowConfigModal(false)
      fetchAgents()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save AI agent')
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
                      <div className="text-[10px] font-black text-[#5e9cb9] uppercase tracking-widest mb-3">System Identity</div>
                      <p className="text-sm text-[#8a99a8] line-clamp-3 leading-relaxed italic border-l-2 border-[#1a2126] pl-4">"{agent.system_prompt}"</p>
                    </div>

                    <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#5e9cb9]/60 mb-4">
                      <span>Engine: GPT-4o</span>
                      <span>Voice: Aria Neural</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="px-4 py-3 bg-[#5e9cb9] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] shadow-xl shadow-[#5e9cb9]/10 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="px-4 py-3 bg-[#1a2126] text-[#8a99a8] border border-[#2d383f] rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

        {/* --- Configuration Modal (Final Optimized Version) --- */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowConfigModal(false)}></div>

              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-5xl transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                  <div className="h-full flex flex-row bg-[#0b1114] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden text-gray-100 font-sans border-l border-[#1a2126]">

                    {/* Sidebar Helper */}
                    <div className="w-80 flex-shrink-0 border-r border-[#1a2126] flex col bg-[#05080a]/50 hidden lg:flex flex-col">
                      <div className="p-8 border-b border-[#1a2126]">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#5e9cb9] animate-pulse shadow-[0_0_8px_#5e9cb9]"></div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5e9cb9]">Helper Assistant</h3>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="p-5 bg-[#121a1e] rounded-2xl border border-[#1a2126] text-[11px] leading-relaxed text-[#8a99a8] shadow-inner font-medium">
                          I'm monitoring your configuration. Your current prompt setup is optimized for <span className="text-white font-bold">low-latency</span> responses.
                        </div>
                      </div>
                      <div className="p-6 border-t border-[#1a2126]">
                        <div className="relative group">
                          <input type="text" placeholder="Ask AI..." className="w-full bg-[#05080a] border border-[#1a2126] rounded-xl px-4 py-4 text-xs focus:ring-1 focus:ring-[#5e9cb9]/50 outline-none transition-all placeholder-gray-800" />
                          <button className="absolute right-3 top-3.5 p-1 text-[#5e9cb9] hover:scale-110 transition-all">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Modal Body */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b1114]">
                      {/* Top Header */}
                      <div className="py-8 px-10 bg-[#0b1114] border-b border-[#1a2126] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-black text-white tracking-tighter" id="slide-over-title">
                                {formData.agent_name || 'Agent Identity'}
                              </h2>
                              <div className="px-2 py-0.5 bg-[#5e9cb9]/10 text-[#5e9cb9] text-[8px] font-black rounded border border-[#5e9cb9]/20 uppercase tracking-widest">v1.4.0</div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold">
                              <span className="flex items-center gap-1.5 text-green-400">
                                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span> SYSTEM READY
                              </span>
                              <span className="text-[#8a99a8] border-l border-[#1a2126] pl-4">LATENCY: <span className="text-white">~450ms</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-[#05080a] p-1 rounded-xl flex border border-[#1a2126] shadow-inner">
                            <button className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab !== 'code' ? 'bg-[#5e9cb9] text-white shadow-lg shadow-[#5e9cb9]/20' : 'text-[#8a99a8] hover:text-white'}`} onClick={() => setActiveTab('details')}>Visual</button>
                            <button className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'code' ? 'bg-[#5e9cb9] text-white shadow-lg shadow-[#5e9cb9]/20' : 'text-[#8a99a8] hover:text-white'}`} onClick={() => setActiveTab('code')}>Source</button>
                          </div>
                          <button type="button" className="w-10 h-10 flex items-center justify-center bg-[#1a2126] rounded-xl text-[#8a99a8] hover:text-white transition-all border border-[#2d383f] hover:border-[#5e9cb9]/50" onClick={() => setShowConfigModal(false)}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Nav Tabs */}
                      <div className="px-10 border-b border-[#1a2126] flex space-x-10 overflow-x-auto no-scrollbar bg-[#0b1114]">
                        {['Details', 'Settings', 'Knowledge', 'Connectivity', 'Post-Call', 'Playground'].map((tLabel) => {
                          const tabMap: Record<string, string> = {
                            'Details': 'details',
                            'Settings': 'settings',
                            'Knowledge': 'knowledge_base',
                            'Connectivity': 'integrations',
                            'Post-Call': 'post-call',
                            'Playground': 'test'
                          };
                          const tab = tabMap[tLabel];
                          const isActive = activeTab === tab || (activeTab === 'details' && tab === 'details');
                          return (
                            <button
                              key={tLabel}
                              onClick={() => setActiveTab(tab)}
                              className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${isActive ? 'text-[#5e9cb9]' : 'text-[#8a99a8] hover:text-white'}`}
                            >
                              {tLabel}
                              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5e9cb9] shadow-[0_0_15px_#5e9cb9]"></div>}
                            </button>
                          )
                        })}
                      </div>

                      <div className="relative flex-1 py-10 px-10 overflow-y-auto bg-[#0b1114] custom-scrollbar">
                        {/* 1. Details Tab */}
                        {activeTab === 'details' && (
                          <div className="space-y-12 animate-fadeIn">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {[
                                { label: 'Language', value: 'English (US)', icon: '🌐' },
                                { label: 'Voice Model', value: 'Neural HD', icon: '🎙️' },
                                { label: 'Intelligence', value: 'GPT-4o Turbo', icon: '🧠' },
                                { label: 'Transcription', value: 'Deepgram v3', icon: '📝' },
                              ].map((card) => (
                                <div key={card.label} className="bg-[#121a1e]/40 border border-[#1a2126] p-6 rounded-[24px] hover:border-[#5e9cb9]/40 transition-all cursor-pointer group hover:bg-[#121a1e]/60 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl transform translate-x-2 -translate-y-2">{card.icon}</div>
                                  <div className="text-[9px] font-black uppercase tracking-widest text-[#8a99a8] mb-2">{card.label}</div>
                                  <div className="text-xs font-bold text-white group-hover:text-[#5e9cb9] transition-colors">{card.value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5e9cb9]">Initialize Message</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-10 h-5 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_15px_rgba(94,156,185,0.4)] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5"></div>
                                </label>
                              </div>
                              <textarea
                                className="w-full bg-[#05080a] border border-[#1a2126] rounded-[24px] p-8 text-sm text-white focus:ring-1 focus:ring-[#5e9cb9]/30 placeholder-gray-800 resize-none h-32 outline-none font-medium leading-relaxed shadow-inner transition-all"
                                value={formData.system_prompt}
                                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                              />
                            </div>

                            <div className="space-y-6">
                              <div className="flex justify-between items-center bg-[#121a1e]/30 px-6 py-4 rounded-2xl border border-[#1a2126]">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Logic Sequence</h3>
                                <button
                                  onClick={() => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      flow_steps: [...formData.configuration.flow_steps, {
                                        id: Date.now().toString(),
                                        name: 'New Sequence',
                                        content: ''
                                      }]
                                    }
                                  })}
                                  className="px-6 py-2.5 bg-[#5e9cb9] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-[#5e9cb9]/20"
                                >
                                  + NEW STEP
                                </button>
                              </div>
                              <div className="space-y-6 pt-4 relative">
                                <div className="absolute left-[31px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#1a2126] via-[#2d383f] to-[#1a2126] rounded-full z-0 opacity-50"></div>
                                {formData.configuration.flow_steps.map((step, idx) => (
                                  <div key={step.id} className="relative z-10 pl-12 group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#0b1114] bg-[#1a2126] group-hover:bg-[#5e9cb9] group-hover:shadow-[0_0_10px_#5e9cb9] transition-all duration-500 z-10"></div>
                                    <div className="bg-[#121a1e] border border-[#1a2126] rounded-[28px] overflow-hidden group-hover:border-[#5e9cb9]/30 transition-all shadow-2xl">
                                      <div className="px-8 py-6 flex items-center justify-between border-b border-[#1a2126]/40 bg-[#121a1e]/60">
                                        <div className="flex items-center gap-5">
                                          <div className="text-[10px] font-black text-[#5e9cb9] bg-[#5e9cb9]/10 w-7 h-7 flex items-center justify-center rounded-lg border border-[#5e9cb9]/20">{String(idx + 1).padStart(2, '0')}</div>
                                          <input
                                            className="bg-transparent border-none text-[12px] font-bold text-white focus:ring-0 p-0 w-64 outline-none uppercase tracking-[0.1em]"
                                            value={step.name}
                                            onChange={(e) => {
                                              const newSteps = [...formData.configuration.flow_steps];
                                              newSteps[idx].name = e.target.value;
                                              setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <button
                                            onClick={() => {
                                              const newSteps = formData.configuration.flow_steps.filter((_, i) => i !== idx);
                                              setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                            }}
                                            className="text-[#8a99a8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all mr-4"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                          <label className="relative inline-flex items-center cursor-pointer scale-90">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-10 h-5 bg-[#05080a] rounded-full peer peer-checked:bg-[#5e9cb9] peer-checked:shadow-[0_0_15px_rgba(94,156,185,0.4)] transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5"></div>
                                          </label>
                                        </div>
                                      </div>
                                      <div className="p-8">
                                        <textarea
                                          className="w-full bg-transparent border-none p-0 text-sm text-[#8a99a8] focus:ring-0 resize-none h-24 leading-relaxed outline-none font-medium italic"
                                          value={step.content}
                                          onChange={(e) => {
                                            const newSteps = [...formData.configuration.flow_steps];
                                            newSteps[idx].content = e.target.value;
                                            setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
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
                        {activeTab === 'settings' && (
                          <div className="space-y-8 animate-fadeIn">
                            <div className="bg-[#121a1e] p-10 rounded-[40px] border border-[#1a2126] shadow-2xl">
                              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-10 border-l-4 border-[#5e9cb9] pl-6">Core Configuration</h3>
                              <div className="space-y-8">
                                {[
                                  { title: 'Background Ambiance', desc: 'Simulate natural environments during calls.' },
                                  { title: 'Call Recording', desc: 'Securely archive all agent interactions.' },
                                  { title: 'Natural Fillers', desc: 'Use "uh-huh", "got it" for human-like flow.' }
                                ].map((item) => (
                                  <div key={item.title} className="flex items-center justify-between p-6 bg-[#0b1114] rounded-3xl border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all cursor-pointer group">
                                    <div className="space-y-1">
                                      <div className="text-sm font-bold text-white tracking-tight">{item.title}</div>
                                      <div className="text-[11px] text-[#8a99a8] font-medium">{item.desc}</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" />
                                      <div className="w-12 h-6 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] peer-checked:shadow-[0_0_15px_rgba(94,156,185,0.4)] transition-all after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-6"></div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Knowledge Base Tab */}
                        {activeTab === 'knowledge_base' && (
                          <div className="space-y-10 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="bg-[#121a1e] p-10 rounded-[40px] border border-[#1a2126] flex flex-col items-center justify-center text-center space-y-6 hover:border-[#5e9cb9]/30 transition-all cursor-pointer group shadow-2xl">
                                <div className="w-20 h-20 bg-[#5e9cb9]/10 rounded-3xl flex items-center justify-center text-[#5e9cb9] group-hover:scale-110 transition-transform shadow-inner">
                                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-black text-white uppercase tracking-tighter">Upload Documents</div>
                                  <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-widest">PDF, TXT, DOCX</div>
                                </div>
                              </div>
                              <div className="bg-[#121a1e] p-10 rounded-[40px] border border-[#1a2126] flex flex-col items-center justify-center text-center space-y-6 hover:border-[#5e9cb9]/30 transition-all cursor-pointer group shadow-2xl">
                                <div className="w-20 h-20 bg-[#5e9cb9]/10 rounded-3xl flex items-center justify-center text-[#5e9cb9] group-hover:scale-110 transition-transform shadow-inner">
                                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-black text-white uppercase tracking-tighter">Scrape Website</div>
                                  <div className="text-[10px] text-[#8a99a8] font-black uppercase tracking-widest">Live Content Sync</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-[#05080a] p-10 rounded-[40px] border border-[#1a2126] shadow-inner relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-[#5e9cb9]/5 rounded-full blur-3xl"></div>
                              <div className="flex items-center justify-between mb-10 relative">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5e9cb9]">Active Context Corpus</h3>
                                <span className="text-[9px] font-black text-[#8a99a8] uppercase tracking-widest bg-[#121a1e] px-3 py-1 rounded-full border border-[#1a2126]">0.4 MB / 100 MB</span>
                              </div>
                              <div className="space-y-4 relative">
                                <div className="p-5 bg-[#121a1e] rounded-[24px] border border-[#1a2126] flex items-center justify-between group hover:border-[#5e9cb9]/40 transition-all">
                                  <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 bg-[#5e9cb9]/20 rounded-xl flex items-center justify-center text-[#5e9cb9] font-black text-[10px] shadow-sm">PDF</div>
                                    <div className="space-y-0.5">
                                      <div className="text-xs font-bold text-white">Project_Pegasus_Spec.pdf</div>
                                      <div className="text-[9px] text-[#8a99a8] font-black uppercase tracking-widest">Uploaded 2h ago</div>
                                    </div>
                                  </div>
                                  <button className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">Remove</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Connectivity Tab */}
                        {activeTab === 'integrations' && (
                          <div className="space-y-8 animate-fadeIn">
                            <div className="grid grid-cols-1 gap-4">
                              {[
                                { name: 'Twilio Voice', status: 'Connected', icon: '📞', provider: 'Telephony' },
                                { name: 'OpenAI GPT-4o', status: 'Active', icon: '🧠', provider: 'Intelligence' },
                                { name: 'Custom Webhook', status: 'Pending', icon: '🪝', provider: 'Workflow' }
                              ].map((int) => (
                                <div key={int.name} className="p-8 bg-[#121a1e] rounded-[40px] border border-[#1a2126] flex items-center justify-between hover:border-[#5e9cb9]/20 transition-all group shadow-2xl">
                                  <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 bg-[#0b1114] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-[#1a2126] group-hover:border-[#5e9cb9]/20 transition-all">{int.icon}</div>
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a99a8]">{int.provider}</div>
                                      <div className="text-base font-black text-white tracking-tighter">{int.name}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${int.status === 'Active' || int.status === 'Connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 animate-pulse'}`}></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#8a99a8]">{int.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button className="px-8 py-3.5 bg-[#0b1114] text-white rounded-2xl text-[10px] font-black border border-[#1a2126] hover:bg-[#1a2126] transition-all uppercase tracking-widest shadow-xl">Configure SDK</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Post-Call Analysis Tab */}
                        {activeTab === 'post-call' && (
                          <div className="space-y-8 animate-fadeIn">
                            <div className="bg-[#121a1e] p-10 rounded-[40px] border border-[#1a2126] shadow-2xl overflow-hidden relative">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5e9cb9]/50 to-transparent"></div>
                              <h3 className="text-[11px] font-black text-[#5e9cb9] uppercase tracking-[0.2em] mb-12 border-l-4 border-[#5e9cb9] pl-6">Data Extraction Engine</h3>
                              <div className="space-y-6">
                                {[
                                  { label: 'Conversational Summary', desc: 'Generate a structured bullet-point recap of every interaction.' },
                                  { label: 'Sentiment Vectoring', desc: 'Detect emotional shifts and caller satisfaction automatically.' },
                                  { label: 'Entity Extraction', desc: 'Automated identification of names, dates, and contact data.' }
                                ].map((action) => (
                                  <div key={action.label} className="flex items-center justify-between p-8 bg-[#0b1114] rounded-[32px] border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all group">
                                    <div className="space-y-2">
                                      <div className="text-sm font-bold text-white tracking-tight">{action.label}</div>
                                      <div className="text-[11px] text-[#8a99a8] font-medium leading-relaxed max-w-md">{action.desc}</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" defaultChecked={action.label.includes('Extract')} />
                                      <div className="w-12 h-6 bg-[#1a2126] rounded-full peer peer-checked:bg-[#5e9cb9] transition-all peer-checked:shadow-[0_0_15px_rgba(94,156,185,0.4)] after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Playground Tab */}
                        {activeTab === 'test' && (
                          <div className="h-full flex flex-col items-center justify-center space-y-12 animate-fadeIn pb-12">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-[#5e9cb9] rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                              <div className="w-40 h-40 bg-[#121a1e] border-4 border-[#1a2126] rounded-full flex items-center justify-center relative z-10 shadow-2xl group-hover:border-[#5e9cb9]/50 transition-all duration-700">
                                <svg className="w-16 h-16 text-[#5e9cb9] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"></path></svg>
                              </div>
                            </div>
                            <div className="text-center space-y-4">
                              <h3 className="text-2xl font-black text-white tracking-tighter">Ready for Live Test</h3>
                              <p className="text-[#8a99a8] text-sm max-w-sm font-medium leading-relaxed">Launch a secure web-socket call to hear your assistant's personality and logic in real-time.</p>
                            </div>
                            <div className="flex gap-6">
                              <button className="px-12 py-5 bg-[#5e9cb9] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] shadow-2xl shadow-[#5e9cb9]/30 transition-all hover:-translate-y-1">Start Web Call</button>
                              <button className="px-12 py-5 bg-[#1a2126] text-[#8a99a8] rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:text-white border border-[#2d383f] transition-all">Mobile Preview</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sticky Footer */}
                      <div className="p-8 px-10 border-t border-[#1a2126] bg-[#0b1114] flex justify-end gap-6 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20">
                        <button onClick={() => setShowConfigModal(false)} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-[#8a99a8] hover:text-white transition-colors">Discard</button>
                        <button onClick={handleSubmit} className="px-12 py-4 bg-[#5e9cb9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#5e9cb9]/40 hover:bg-[#4d8aa8] transition-all transform active:scale-95">Deploy Assistant</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
