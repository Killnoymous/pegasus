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
        is_active: true, // Always active on create/update for simplicity or add toggle
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
      <div className="max-w-7xl mx-auto space-y-12">
        {/* --- OmniDimension Style Prompt Header --- */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#5e9cb9] to-blue-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition-all"></div>
          <div className="relative bg-[#0b1114] border border-[#1a2126] rounded-2xl p-8 md:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5e9cb9]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                Create your <span className="text-[#5e9cb9]">AI Voice Assistant</span>
              </h1>
              <p className="text-[#8a99a8] text-lg mb-10 font-medium">Build, test, and ship reliable voice agents in seconds.</p>

              <div className="relative">
                <textarea
                  className="w-full bg-[#05080a] border border-[#1a2126] rounded-2xl p-6 md:p-8 text-white text-lg focus:ring-2 focus:ring-[#5e9cb9]/50 focus:border-[#5e9cb9] transition-all min-h-[160px] placeholder-gray-700 shadow-inner"
                  placeholder="e.g. Create a customer support agent for a pizza delivery service that helps users order and check status."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 flex gap-3">
                  <button
                    onClick={() => {
                      setIsTestLoading(true);
                      setTimeout(() => {
                        setTestInput("Agent Role: Pizza Delivery Assistant\nCapabilities: Take orders, check status, provide menu info.\nTone: Friendly and efficient.\nInstructions: Greet customer, ask for order details or order ID for status check.");
                        setIsTestLoading(false);
                      }, 800);
                    }}
                    className="px-6 py-3 bg-[#1a2126] text-[#8a99a8] rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-all border border-[#2d383f] flex items-center gap-2"
                  >
                    {isTestLoading ? <div className="w-3 h-3 border-2 border-[#5e9cb9] border-t-transparent rounded-full animate-spin"></div> : '✨'}
                    Enhance Prompt
                  </button>
                  <button
                    onClick={() => handleOpenCreate(testInput)}
                    className="px-8 py-3 bg-[#5e9cb9] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#4d8aa8] transition-all shadow-xl shadow-[#5e9cb9]/20 flex items-center gap-2"
                  >
                    Create Agent
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
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
            onClick={handleOpenCreate}
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
                {/* Glow Effect on Hover */}
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

        {/* --- Configuration Modal (Overhauled) --- */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity" onClick={() => setShowConfigModal(false)}></div>

              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-5xl transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                  <div className="h-full flex flex-row bg-[#05080a] shadow-2xl overflow-hidden text-gray-100 font-sans border-l border-[#1a2126]">

                    {/* Left Sidebar: Helper Chat */}
                    <div className="w-80 flex-shrink-0 border-r border-[#1a2126] flex col bg-[#0b1114] hidden lg:flex flex-col">
                      <div className="p-6 border-b border-[#1a2126]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#5e9cb9]">Helper Chat</h3>
                        <p className="text-[10px] text-[#8a99a8] mt-1">Ask me anything about setup.</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="p-3 bg-[#121a1e] rounded-2xl border border-[#1a2126] text-xs leading-relaxed">
                          Welcome! I'm here to help you configure your <strong>{formData.agent_name || 'Assistant'}</strong>. You can start by defining the conversation flow on the right.
                        </div>
                      </div>
                      <div className="p-4 border-t border-[#1a2126]">
                        <div className="relative">
                          <input type="text" placeholder="Type a message..." className="w-full bg-[#121a1e] border border-[#1a2126] rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#5e9cb9] outline-none" />
                          <button className="absolute right-2 top-2.5 p-1 text-[#5e9cb9]">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Top Bar */}
                      <div className="py-6 px-8 bg-[#0b1114]/50 border-b border-[#1a2126] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h2 className="text-xl font-black text-white tracking-tight" id="slide-over-title">
                            {formData.agent_name || 'Unnamed Assistant'}
                          </h2>
                          <div className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-md border border-green-500/20 uppercase tracking-tighter">Incoming Status</div>
                          <div className="text-[10px] text-[#8a99a8] font-mono leading-none border-l border-[#1a2126] pl-4">Cost/Minute: <span className="text-white">$0.100</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-[#121a1e] p-1 rounded-xl flex border border-[#1a2126]">
                            <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab !== 'code' ? 'bg-[#5e9cb9] text-white shadow-lg shadow-[#5e9cb9]/20' : 'text-[#8a99a8]'}`} onClick={() => setActiveTab('details')}>UI</button>
                            <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'code' ? 'bg-[#5e9cb9] text-white shadow-lg shadow-[#5e9cb9]/20' : 'text-[#8a99a8]'}`} onClick={() => setActiveTab('code')}>Code</button>
                          </div>
                          <button type="button" className="w-9 h-9 flex items-center justify-center bg-[#1a2126] rounded-lg text-[#8a99a8] hover:text-white transition-all border border-[#2d383f]" onClick={() => setShowConfigModal(false)}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Tab Navigation */}
                      <div className="px-8 border-b border-[#1a2126] flex space-x-8 overflow-x-auto no-scrollbar bg-[#05080a]">
                        {['Details', 'Settings', 'Knowledge Base', 'Integrations', 'Post-Call', 'Test'].map((tabLabel) => {
                          const tab = tabLabel.toLowerCase().replace(' ', '_');
                          const isActive = activeTab === tab || (activeTab === 'details' && tab === 'details');
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${isActive ? 'text-[#5e9cb9]' : 'text-[#8a99a8] hover:text-white'}`}
                            >
                              {tabLabel}
                              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5e9cb9] shadow-[0_0_8px_#5e9cb9]"></div>}
                            </button>
                          )
                        })}
                      </div>

                      <div className="relative flex-1 py-8 px-6">
                        {/* --- Tab Content --- */}

                        {/* 1. Assistant Details Overhaul */}
                        {(activeTab === 'details' || activeTab === 'assistant_details') && (
                          <div className="space-y-10 animate-fadeIn">
                            {/* Grid of Settings Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {[
                                { label: 'Languages', value: 'English (US)', icon: '🌐' },
                                { label: 'Voice (TTS)', value: 'Google Neural', icon: '🎙️' },
                                { label: 'AI Model (LLM)', value: 'GPT-4o', icon: '🧠' },
                                { label: 'Transcription (STT)', value: 'Deepgram', icon: '📝' },
                              ].map((card) => (
                                <div key={card.label} className="bg-[#121a1e] border border-[#1a2126] p-4 rounded-2xl hover:border-[#5e9cb9]/30 transition-all cursor-pointer group shadow-sm">
                                  <div className="text-xl mb-3">{card.icon}</div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-[#8a99a8] mb-1">{card.label}</div>
                                  <div className="text-xs font-bold text-white group-hover:text-[#5e9cb9] transition-colors">{card.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Welcome Message Section */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                  Welcome Message
                                  <svg className="w-3 h-3 text-[#8a99a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#8a99a8] uppercase">Dynamic</span>
                                  <div className="w-8 h-4 bg-[#5e9cb9] rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                                </div>
                              </div>
                              <textarea
                                className="w-full bg-[#121a1e] border border-[#1a2126] rounded-2xl p-5 text-sm text-white focus:ring-1 focus:ring-[#5e9cb9]/50 placeholder-gray-700 resize-none h-24 outline-none"
                                placeholder="Hello! Thank you for calling [Company Name]. How can I help you today?"
                                value={formData.system_prompt.split('\n')[0]}
                                onChange={(e) => { }}
                              />
                            </div>

                            {/* Conversational Flow Section (The Numbered Builder) */}
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white">Conversational Flow (Assistant's Instructions)</h3>
                                <button
                                  onClick={() => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      flow_steps: [...formData.configuration.flow_steps, {
                                        id: Date.now().toString(),
                                        name: 'New Section',
                                        content: ''
                                      }]
                                    }
                                  })}
                                  className="px-4 py-2 bg-[#5e9cb9]/10 text-[#5e9cb9] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#5e9cb9]/20 hover:bg-[#5e9cb9]/20 transition-all">
                                  + Add Section
                                </button>
                              </div>

                              <div className="space-y-4">
                                {formData.configuration.flow_steps.map((step, idx) => (
                                  <div key={step.id} className="bg-[#121a1e] border border-[#1a2126] rounded-2xl overflow-hidden group hover:border-[#5e9cb9]/20 transition-all shadow-sm">
                                    <div className="px-6 py-4 flex items-center justify-between border-b border-[#1a2126]/50 bg-[#1a2126]/30">
                                      <div className="flex items-center gap-4">
                                        <div className="text-[10px] font-black text-[#5e9cb9] bg-[#5e9cb9]/10 w-6 h-6 flex items-center justify-center rounded-lg border border-[#5e9cb9]/20">{idx + 1}</div>
                                        <input
                                          className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 p-0 w-64 outline-none"
                                          value={step.name}
                                          onChange={(e) => {
                                            const newSteps = [...formData.configuration.flow_steps];
                                            newSteps[idx].name = e.target.value;
                                            setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-[#8a99a8] uppercase tracking-tighter">ON</span>
                                          <div className="w-10 h-5 bg-[#5e9cb9] rounded-full relative cursor-pointer shadow-inner"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newSteps = formData.configuration.flow_steps.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                          }}
                                          className="text-[#8a99a8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="p-6">
                                      <textarea
                                        className="w-full bg-transparent border-none p-0 text-sm text-[#8a99a8] focus:ring-0 resize-none h-20 leading-relaxed outline-none"
                                        value={step.content}
                                        onChange={(e) => {
                                          const newSteps = [...formData.configuration.flow_steps];
                                          newSteps[idx].content = e.target.value;
                                          setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                        }}
                                        placeholder="Define the behavior for this section..."
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'settings' && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="bg-[#121a1e] p-8 rounded-3xl border border-[#1a2126] shadow-xl">
                              <h3 className="text-sm font-bold text-white mb-6">Call Handling</h3>
                              <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-[#0b1114] rounded-2xl border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all cursor-pointer">
                                  <div>
                                    <div className="text-xs font-bold text-white tracking-tight">Background Noise Ambiance</div>
                                    <div className="text-[10px] text-[#8a99a8] mt-1">Simulate office or cafe environment.</div>
                                  </div>
                                  <div className="w-12 h-6 bg-[#1a2126] rounded-full relative shadow-inner"><div className="absolute left-1 top-1 w-4 h-4 bg-[#8a99a8] rounded-full shadow-md"></div></div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[#0b1114] rounded-2xl border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all cursor-pointer">
                                  <div>
                                    <div className="text-xs font-bold text-white tracking-tight">Call Recording</div>
                                    <div className="text-[10px] text-[#8a99a8] mt-1">Download and listen to calls later.</div>
                                  </div>
                                  <div className="w-12 h-6 bg-[#5e9cb9] rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#121a1e] p-8 rounded-3xl border border-[#1a2126] shadow-xl">
                              <h3 className="text-sm font-bold text-white mb-6">Voice & Personality</h3>
                              <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-[#0b1114] rounded-2xl border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all cursor-pointer">
                                  <div>
                                    <div className="text-xs font-bold text-white tracking-tight">Natural Filler Phrases</div>
                                    <div className="text-[10px] text-[#8a99a8] mt-1">Use "umm", "uh-huh" for human-like feel.</div>
                                  </div>
                                  <div className="w-12 h-6 bg-[#5e9cb9] rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'knowledge_base' && (
                          <div className="space-y-8 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="bg-[#121a1e] border-2 border-dashed border-[#1a2126] p-10 rounded-3xl text-center hover:border-[#5e9cb9]/50 transition-all cursor-pointer group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                                <div className="text-xs font-black uppercase tracking-widest text-[#5e9cb9] mb-1">Upload Documents</div>
                                <div className="text-[10px] text-[#8a99a8]">PDF, TXT or DOCX (Max 10MB)</div>
                              </div>
                              <div className="bg-[#121a1e] border-2 border-dashed border-[#1a2126] p-10 rounded-3xl text-center hover:border-[#5e9cb9]/50 transition-all cursor-pointer group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
                                <div className="text-xs font-black uppercase tracking-widest text-[#5e9cb9] mb-1">Website Crawl</div>
                                <div className="text-[10px] text-[#8a99a8]">Sync knowledge from URLs</div>
                              </div>
                            </div>
                            <div className="bg-[#0b1114] p-6 rounded-2xl border border-[#1a2126] flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#5e9cb9]/10 rounded-xl flex items-center justify-center text-[#5e9cb9]">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white tracking-tight">RAG Context Status</div>
                                  <div className="text-[10px] text-[#8a99a8]">0 documents synced to vector store.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'integrations' && (
                          <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                            {[
                              { name: 'Cal.com', icon: '📅', desc: 'Scheduling & Appointments' },
                              { name: 'Salesforce', icon: '☁️', desc: 'CRM Lead Management' },
                              { name: 'Google Sheets', icon: '📊', desc: 'Data Logging' },
                              { name: 'n8n', icon: '⚡', desc: 'Worfklow Automation' },
                            ].map(int => (
                              <div key={int.name} className="bg-[#121a1e] p-6 rounded-3xl border border-[#1a2126] hover:border-[#5e9cb9]/30 transition-all cursor-pointer group shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-2xl">{int.icon}</div>
                                  <div className="px-2 py-0.5 bg-[#1a2126] text-[#8a99a8] text-[8px] font-black uppercase rounded border border-[#2d383f]">Ready</div>
                                </div>
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-[#5e9cb9] transition-colors">{int.name}</div>
                                <div className="text-[10px] text-[#8a99a8] leading-tight">{int.desc}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeTab === 'post-call' && (
                          <div className="space-y-8 animate-fadeIn">
                            <div className="bg-[#121a1e] p-8 rounded-3xl border border-[#1a2126] shadow-xl">
                              <h3 className="text-sm font-bold text-white mb-2">Automated Data Extraction</h3>
                              <p className="text-xs text-[#8a99a8] mb-8 leading-relaxed">Define variables for the AI to extract and send to your webhooks.</p>
                              <div className="space-y-4">
                                {['customer_name', 'order_id', 'sentiment_score'].map(v => (
                                  <div key={v} className="flex items-center gap-4 bg-[#0b1114] p-4 rounded-xl border border-[#1a2126] hover:border-[#5e9cb9]/20 transition-all shadow-sm">
                                    <div className="px-3 py-1 bg-[#5e9cb9]/10 text-[#5e9cb9] font-mono text-[10px] rounded-lg border border-[#5e9cb9]/20 uppercase tracking-tighter">{v}</div>
                                    <div className="flex-1 text-[10px] text-[#8a99a8]">Extracted automatically from call transcript.</div>
                                    <button className="text-[10px] font-black uppercase text-[#8a99a8] hover:text-white transition-all">Config</button>
                                  </div>
                                ))}
                                <button className="w-full py-5 border border-dashed border-[#1a2126] rounded-xl text-[10px] font-black uppercase text-[#8a99a8] hover:border-[#5e9cb9]/50 hover:text-[#5e9cb9] transition-all bg-[#05080a]/50">+ Add Variable</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'code' && (
                          <div className="animate-fadeIn h-full flex flex-col">
                            <div className="flex-1 bg-[#0b1114] rounded-2xl border border-[#1a2126] p-8 font-mono text-xs overflow-auto shadow-inner">
                              <pre className="text-[#5e9cb9] leading-relaxed">
                                {`# Pegasus Voice SDK v1.0
import pegasus

# Instantiate Assistant
ai = pegasus.Assistant(
    id="${formData.id || 'temp_agent_id'}",
    engine="pegasus-v2-turbo",
    voice="pro_female_v1"
)

# Attach Conversational Logic
ai.set_instructions([
${formData.configuration.flow_steps.map(s => `    ("${s.name}", "${s.content.substring(0, 30)}...")`).join(',\n')}
])

# Deploy and Get Public URL
deployment = ai.deploy()
print(f"Agent live at: {deployment.hook_url}")`}
                              </pre>
                            </div>
                          </div>
                        )}

                        {activeTab === 'test' && (
                          <div className="space-y-10 animate-fadeIn">
                            <div className="bg-[#121a1e] border-2 border-dashed border-[#1a2126] p-12 rounded-[40px] text-center space-y-6 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-b from-[#5e9cb9]/5 to-transparent"></div>
                              <div className="relative">
                                <div className="w-20 h-20 bg-[#5e9cb9]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(94,156,185,0.2)] animate-pulse">
                                  <div className="w-12 h-12 bg-[#5e9cb9] rounded-full flex items-center justify-center text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                  </div>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight">Test your assistant</h3>
                                <p className="text-xs text-[#8a99a8] max-w-sm mx-auto leading-relaxed">Experience the low-latency voice response with your real-time configuration.</p>
                              </div>

                              <div className="relative pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="px-8 py-4 bg-[#5e9cb9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] transition-all shadow-xl shadow-[#5e9cb9]/30 flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                                  Start Phone Call
                                </button>
                                <button className="px-8 py-4 bg-[#1a2126] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2d383f] transition-all border border-[#2d383f] flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                  Start Web Call
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="py-8 px-10 bg-[#0b1114] border-t border-[#1a2126] flex justify-end gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                        <button
                          type="button"
                          onClick={() => setShowConfigModal(false)}
                          className="px-8 py-4 bg-[#1a2126] text-[#8a99a8] border border-[#2d383f] rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-[#2d383f] transition-all"
                        >
                          Discard Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="px-12 py-4 bg-[#5e9cb9] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4d8aa8] shadow-2xl shadow-[#5e9cb9]/30 transition-all transform active:scale-95 flex items-center gap-2"
                        >
                          Deploy Assistant
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </button>
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
