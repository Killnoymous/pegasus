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

  const handleOpenCreate = () => {
    setFormData({
      id: null,
      agent_name: '',
      system_prompt: '',
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
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-end sm:justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">AI Agents</h1>
            <p className="text-lg text-[#8a99a8] font-medium">
              Manage your AI voice assistants and their behaviors.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-xl text-sm font-black text-white bg-[#5e9cb9] hover:bg-[#4d8aa8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5e9cb9] transition-all duration-300 transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Create New Agent
            </button>
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
              <div key={agent.id} className="bg-[#0b1114] overflow-hidden rounded-2xl border border-[#1a2126] hover:border-[#5e9cb9]/30 transition-all duration-300 group flex flex-col h-full hover:shadow-2xl hover:shadow-[#5e9cb9]/5">
                <div className="p-6 border-b border-[#1a2126] bg-[#0b1114] flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white truncate">{agent.agent_name}</h3>
                  <button
                    onClick={() => toggleActive(agent)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 border ${agent.is_active
                      ? 'bg-[#5e9cb9]/10 text-[#5e9cb9] border-[#5e9cb9]/20'
                      : 'bg-[#1a2126] text-[#8a99a8] border-[#2d383f]'
                      }`}
                  >
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-sm text-[#8a99a8] line-clamp-4 leading-relaxed flex-1 italic">"{agent.system_prompt}"</p>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="px-4 py-2.5 bg-[#121a1e] border border-[#1a2126] text-white rounded-xl text-xs font-bold hover:bg-[#1a2126] hover:border-[#2d383f] transition-all"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="px-4 py-2.5 bg-red-500/5 border border-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      className={`w-full justify-center inline-flex items-center px-4 py-3 border rounded-xl text-xs font-bold transition-all ${selectedAgent === agent.id
                        ? 'bg-[#5e9cb9] text-white border-transparent'
                        : 'bg-transparent text-[#8a99a8] border-[#1a2126] hover:text-white hover:bg-[#121a1e]'
                        }`}
                    >
                      <svg className={`mr-2 h-4 w-4 transition-transform ${selectedAgent === agent.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11l-7 7-7-7" />
                      </svg>
                      {selectedAgent === agent.id ? 'Close Direct Numbers' : 'Manage Phone Links'}
                    </button>
                    {selectedAgent === agent.id && (
                      <div className="animate-slideDown">
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
            ))}
          </div>
        )}

        {/* --- Configuration Modal --- */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setShowConfigModal(false)}></div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-2xl transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                  <div className="h-full flex flex-col bg-[#0b1114] shadow-2xl overflow-y-scroll text-gray-100 font-sans border-l border-[#1a2126]">
                    <div className="py-8 px-6 bg-[#05080a] border-b border-[#1a2126]">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-white tracking-tight" id="slide-over-title">
                            {formData.id ? 'Edit Assistant' : 'New Assistant'}
                          </h2>
                          <p className="text-xs text-[#8a99a8] font-bold uppercase tracking-widest mt-1">Configuration Panel</p>
                        </div>
                        <button type="button" className="w-10 h-10 flex items-center justify-center bg-[#1a2126] rounded-xl text-[#8a99a8] hover:text-white hover:bg-[#2d383f] transition-all" onClick={() => setShowConfigModal(false)}>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        {['details', 'config', 'flow', 'knowledge', 'integrations', 'post_call', 'behavior', 'test'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                              ? 'bg-[#5e9cb9] text-white shadow-xl shadow-[#5e9cb9]/20'
                              : 'bg-transparent text-[#8a99a8] hover:text-white hover:bg-[#121a1e]'
                              }`}
                          >
                            {tab.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex-1 py-8 px-6">
                      {/* --- Tab Content --- */}

                      {activeTab === 'details' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-[#8a99a8]">Agent Name</label>
                            <input
                              type="text"
                              value={formData.agent_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, agent_name: e.target.value })}
                              className="block w-full bg-[#121a1e] border border-[#1a2126] rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 focus:border-[#5e9cb9] transition-all placeholder-gray-600"
                              placeholder="e.g. Sales Professional"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-[#8a99a8]">System Prompt</label>
                            <textarea
                              rows={12}
                              value={formData.system_prompt}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, system_prompt: e.target.value })}
                              className="block w-full bg-[#121a1e] border border-[#1a2126] rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 focus:border-[#5e9cb9] font-mono text-sm leading-relaxed transition-all placeholder-gray-600"
                              placeholder="Define the personality and core instructions..."
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-[#8a99a8]">Primary Language</label>
                            <select
                              value={formData.language}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, language: e.target.value })}
                              className="block w-full bg-[#121a1e] border border-[#1a2126] rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 focus:border-[#5e9cb9] transition-all appearance-none cursor-pointer"
                            >
                              <option value="en">English (US)</option>
                              <option value="hi">Hindi</option>
                              <option value="es">Spanish</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 2. Config Tab (Audio & Call Settings) */}
                      {activeTab === 'config' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126]">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-bold text-white">Background Audio</h3>
                              <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input
                                  type="checkbox"
                                  id="bg-audio"
                                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 checked:right-0 checked:bg-white"
                                  checked={formData.configuration.background_audio.enabled}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      background_audio: { ...formData.configuration.background_audio, enabled: e.target.checked }
                                    }
                                  })}
                                />
                                <label htmlFor="bg-audio" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${formData.configuration.background_audio.enabled ? 'bg-[#5e9cb9]' : 'bg-[#1a2126]'}`}></label>
                              </div>
                            </div>
                            <p className="text-xs text-[#8a99a8] mb-6">Play ambient sounds during calls for a natural feel.</p>
                            {formData.configuration.background_audio.enabled && (
                              <select
                                className="block w-full bg-[#0b1114] border border-[#1a2126] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50"
                                value={formData.configuration.background_audio.type}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    background_audio: { ...formData.configuration.background_audio, type: e.target.value }
                                  }
                                })}
                              >
                                <option value="office">Office Ambiance</option>
                                <option value="cafe">Cafe Noise</option>
                                <option value="call_center">Call Center</option>
                              </select>
                            )}
                          </div>

                          <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126]">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-bold text-white">Call Transfer</h3>
                              <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input
                                  type="checkbox"
                                  id="call-transfer"
                                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 checked:right-0 checked:bg-white"
                                  checked={formData.configuration.call_transfer.enabled}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      call_transfer: { ...formData.configuration.call_transfer, enabled: e.target.checked }
                                    }
                                  })}
                                />
                                <label htmlFor="call-transfer" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${formData.configuration.call_transfer.enabled ? 'bg-[#5e9cb9]' : 'bg-[#1a2126]'}`}></label>
                              </div>
                            </div>
                            <p className="text-xs text-[#8a99a8] mb-6">Redirect call to a human expert when requested.</p>
                            {formData.configuration.call_transfer.enabled && (
                              <input
                                type="tel"
                                placeholder="+1 234 567 890"
                                className="block w-full bg-[#0b1114] border border-[#1a2126] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50"
                                value={formData.configuration.call_transfer.number}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    call_transfer: { ...formData.configuration.call_transfer, number: e.target.value }
                                  }
                                })}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'flow' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#8a99a8]">Flow Sections</h3>
                            <button
                              type="button"
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
                              className="px-4 py-2 bg-[#5e9cb9]/10 text-[#5e9cb9] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#5e9cb9]/20 hover:bg-[#5e9cb9]/20 transition-all"
                            >
                              + Add Section
                            </button>
                          </div>

                          <div className="space-y-4">
                            {formData.configuration.flow_steps.map((step, index) => (
                              <div key={step.id} className="bg-[#121a1e] border border-[#1a2126] rounded-2xl overflow-hidden group">
                                <div className="bg-[#1a2126]/50 px-5 py-3 flex justify-between items-center border-b border-[#1a2126]">
                                  <input
                                    type="text"
                                    value={step.name}
                                    onChange={(e) => {
                                      const newSteps = [...formData.configuration.flow_steps];
                                      newSteps[index].name = e.target.value;
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                    className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 p-0 w-full"
                                  />
                                  <button
                                    onClick={() => {
                                      const newSteps = formData.configuration.flow_steps.filter((_, i) => i !== index);
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                    className="text-[#8a99a8] hover:text-red-500 transition-colors ml-2"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="p-4">
                                  <textarea
                                    rows={4}
                                    placeholder="Enter instructions for this stage..."
                                    className="block w-full bg-transparent border-none focus:ring-0 text-white text-sm leading-relaxed resize-none p-0"
                                    value={step.content}
                                    onChange={(e) => {
                                      const newSteps = [...formData.configuration.flow_steps];
                                      newSteps[index].content = e.target.value;
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            {formData.configuration.flow_steps.length === 0 && (
                              <div className="text-center py-12 bg-[#121a1e] rounded-2xl border border-dashed border-[#1a2126]">
                                <p className="text-[#8a99a8] text-sm">No sections defined yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. Knowledge Base Tab */}
                      {activeTab === 'knowledge' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-2 border-dashed border-[#1a2126] rounded-2xl p-8 text-center hover:border-[#5e9cb9]/50 transition-all bg-[#0b1114] cursor-pointer group">
                              <div className="mx-auto h-12 w-12 text-[#8a99a8] group-hover:text-[#5e9cb9] transition-colors mb-4">
                                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </div>
                              <h3 className="text-sm font-bold text-white mb-1">Upload Documents</h3>
                              <p className="text-xs text-[#8a99a8]">PDF, TXT or DOCX up to 10MB</p>
                            </div>

                            <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126]">
                              <h3 className="text-sm font-bold text-white mb-2">Website Crawl</h3>
                              <p className="text-xs text-[#8a99a8] mb-6">Import knowledge directly from a URL.</p>
                              <div className="space-y-4">
                                <input
                                  type="url"
                                  placeholder="https://your-website.com"
                                  className="block w-full bg-[#0b1114] border border-[#1a2126] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50"
                                />
                                <button type="button" className="w-full bg-[#5e9cb9] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#4d8aa8] transition-all">
                                  Sync Website
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#5e9cb9]/5 border border-[#5e9cb9]/20 rounded-2xl p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-[#5e9cb9]/20 rounded-xl flex items-center justify-center">
                                <svg className="h-5 w-5 text-[#5e9cb9]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-bold text-[#5e9cb9]">Knowledge Storage</p>
                                <p className="text-xs text-[#8a99a8] mt-1">You are using 0.5MB of 50MB available.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'integrations' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                          {[
                            { name: 'Cal.com', desc: 'Sync your calendar for scheduling.', icon: '📅' },
                            { name: 'Calendly', desc: 'Check availability and schedule.', icon: '🗓️' },
                            { name: 'Salesforce', desc: 'Manage leads and update records.', icon: '☁️' },
                            { name: 'Google Sheets', desc: 'Read and write spreadsheet data.', icon: '📊' },
                            { name: 'Custom API', desc: 'Connect to your own backend.', icon: '⚡' },
                          ].map((integration) => (
                            <div key={integration.name} className="bg-[#121a1e] border border-[#1a2126] rounded-2xl p-6 hover:border-[#5e9cb9]/50 transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-[#0b1114] flex items-center justify-center text-xl">
                                  {integration.icon}
                                </div>
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Ready</span>
                              </div>
                              <h3 className="text-sm font-bold text-white mb-1">{integration.name}</h3>
                              <p className="text-xs text-[#8a99a8] mb-6 leading-relaxed">{integration.desc}</p>
                              <button type="button" className="w-full border border-[#1a2126] text-[#8a99a8] py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white hover:bg-[#1a2126] transition-all">
                                Configure
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'post_call' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#8a99a8] mb-4">Post-Call Action</h3>
                            <select className="block w-full bg-[#0b1114] border border-[#1a2126] rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 appearance-none cursor-pointer">
                              <option>Email Summary</option>
                              <option>Webhook Trigger</option>
                              <option>SMS Notification</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { id: 'summary', label: 'AI Summary', desc: 'Brief overview of the call.' },
                              { id: 'transcript', label: 'Full Transcript', desc: 'Word-for-word record.' },
                              { id: 'sentiment', label: 'Sentiment', desc: 'Mood analysis of caller.' },
                              { id: 'extraction', label: 'Data Points', desc: 'Extract key variables.' },
                            ].map((item) => (
                              <div key={item.id} className="relative flex p-4 bg-[#121a1e] border border-[#1a2126] rounded-2xl hover:border-[#5e9cb9]/30 transition-all cursor-pointer group">
                                <div className="flex items-center h-5">
                                  <input
                                    id={item.id}
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-[#1a2126] bg-[#0b1114] text-[#5e9cb9] focus:ring-[#5e9cb9]/50"
                                  />
                                </div>
                                <div className="ml-4">
                                  <label htmlFor={item.id} className="text-sm font-bold text-white block cursor-pointer">{item.label}</label>
                                  <p className="text-[10px] text-[#8a99a8] mt-1">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'behavior' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#8a99a8] mb-4">Core Personality</h3>
                            <select
                              className="block w-full bg-[#0b1114] border border-[#1a2126] rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 appearance-none cursor-pointer"
                              value={formData.configuration.behavior.personality}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({
                                ...formData,
                                configuration: {
                                  ...formData.configuration,
                                  behavior: { ...formData.configuration.behavior, personality: e.target.value }
                                }
                              })}
                            >
                              <option value="professional">Professional & Formal</option>
                              <option value="friendly">Friendly & Helpful</option>
                              <option value="curious">Curious & Inquisitive</option>
                              <option value="humorous">Witty & Humorous</option>
                            </select>
                          </div>

                          <div className="bg-[#121a1e] p-6 rounded-2xl border border-[#1a2126] flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-white">Natural Speech</h3>
                              <p className="text-[10px] text-[#8a99a8] mt-1">Use filler phrases (umm, uh-huh) to sound human.</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                              <input
                                type="checkbox"
                                id="filler-phrases"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 checked:right-0 checked:bg-white"
                                checked={formData.configuration.behavior.filler_phrases}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    behavior: { ...formData.configuration.behavior, filler_phrases: e.target.checked }
                                  }
                                })}
                              />
                              <label htmlFor="filler-phrases" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${formData.configuration.behavior.filler_phrases ? 'bg-[#5e9cb9]' : 'bg-[#1a2126]'}`}></label>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'test' && (
                        <div className="space-y-8 animate-fadeIn">
                          <div className="bg-[#5e9cb9]/5 border border-[#5e9cb9]/20 rounded-2xl p-6">
                            <p className="text-sm text-[#5e9cb9] font-medium leading-relaxed">
                              Experience your agent in real-time. We'll use your current configuration to generate a voice response.
                            </p>
                          </div>

                          <form onSubmit={handleTestAgent} className="space-y-6">
                            <div className="space-y-3">
                              <label className="text-xs font-black uppercase tracking-widest text-[#8a99a8]">Simulate User Input</label>
                              <textarea
                                className="block w-full bg-[#121a1e] border border-[#1a2126] rounded-2xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-[#5e9cb9]/50 transition-all placeholder-gray-600 resize-none font-medium"
                                rows={4}
                                placeholder="What would you like to say to your assistant?"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                              ></textarea>
                            </div>

                            {testAudioSrc && (
                              <div className="p-6 bg-[#05080a] rounded-2xl border border-[#1a2126] space-y-4 animate-fadeIn">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <p className="text-xs font-black uppercase tracking-widest text-white">Voice Response Ready</p>
                                </div>
                                <audio controls autoPlay src={testAudioSrc} className="w-full h-10 filter invert brightness-200 opacity-80" />
                              </div>
                            )}

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={isTestLoading || !testInput.trim()}
                                className="inline-flex items-center px-8 py-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-[#5e9cb9]/20 text-white bg-[#5e9cb9] hover:bg-[#4d8aa8] focus:outline-none focus:ring-2 focus:ring-[#5e9cb9] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                              >
                                {isTestLoading ? (
                                  <div className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                    Thinking...
                                  </div>
                                ) : 'Initialize Audio Test'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#1a2126] py-8 px-6 bg-[#05080a]">
                      <div className="flex flex-col sm:flex-row gap-4 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowConfigModal(false)}
                          className="px-8 py-4 bg-[#1a2126] text-[#8a99a8] border border-[#2d383f] rounded-xl text-sm font-black uppercase tracking-widest hover:text-white hover:bg-[#2d383f] transition-all"
                        >
                          Discard Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="px-10 py-4 bg-[#5e9cb9] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#4d8aa8] shadow-2xl shadow-[#5e9cb9]/20 transition-all transform active:scale-95"
                        >
                          Save Assistant Settings
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
