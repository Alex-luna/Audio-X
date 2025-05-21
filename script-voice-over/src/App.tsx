import React, { useState, useRef } from 'react'
import './App.css'

function Header() {
  return (
    <header className="flex items-center justify-between py-6 px-8 border-b mb-8">
      <h1 className="text-2xl font-bold">Script Voice Over</h1>
      <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Configurações">
        <span role="img" aria-label="settings">⚙️</span>
      </button>
    </header>
  )
}

function ProjetoForm({ onCreate }: { onCreate: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <form className="flex gap-2 mb-6" onSubmit={e => { e.preventDefault(); if (nome) onCreate(nome) }}>
      <input
        className="border rounded px-3 py-2 flex-1"
        placeholder="Nome do Projeto"
        value={nome}
        onChange={e => setNome(e.target.value)}
        required
      />
      <button className="bg-black text-white px-4 py-2 rounded" type="submit">Criar Projeto</button>
    </form>
  )
}

function ScriptPrincipal({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="mb-8">
      <button className="mb-2 text-lg font-semibold" onClick={() => setOpen(o => !o)}>
        {open ? '▼' : '►'} Script Principal
      </button>
      {open && (
        <textarea
          className="w-full min-h-[120px] border rounded p-3 font-mono"
          placeholder="Cole seu script em Markdown aqui..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </section>
  )
}

function Sessao({
  index,
  value,
  onChange,
  descricao,
  onDescricaoChange,
}: {
  index: number
  value: string
  onChange: (v: string) => void
  descricao: string
  onDescricaoChange: (v: string) => void
}) {
  const [aba, setAba] = useState<'script' | 'descricao'>('script')
  // Gravação de áudio
  const [takes, setTakes] = useState<{ url: string; blob: Blob; duracao: number }[]>([])
  const [gravando, setGravando] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<number | null>(null)
  const [tempo, setTempo] = useState(0)

  function startRecording() {
    if (takes.length >= 3) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setChunks([])
      setTempo(0)
      recorder.start()
      setGravando(true)
      timerRef.current = setInterval(() => setTempo(t => t + 1), 1000)
      recorder.ondataavailable = e => setChunks(chs => [...chs, e.data])
      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setTakes(tks => [...tks, { url, blob, duracao: tempo }].slice(0, 3))
        setChunks([])
        setTempo(0)
      }
    })
  }
  function stopRecording() {
    mediaRecorder?.stop()
    setGravando(false)
  }
  function deleteTake(idx: number) {
    setTakes(tks => tks.filter((_, i) => i !== idx))
  }

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <div className="flex gap-2 mb-2">
        <button
          className={`px-2 py-1 rounded text-sm font-semibold ${aba === 'script' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setAba('script')}
        >
          Script
        </button>
        <button
          className={`px-2 py-1 rounded text-sm font-semibold ${aba === 'descricao' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setAba('descricao')}
        >
          Descrição de Cena
        </button>
      </div>
      {aba === 'script' ? (
        <textarea
          className="w-full min-h-[60px] border rounded p-2 font-mono mb-2"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <textarea
          className="w-full min-h-[40px] border rounded p-2 mb-2"
          placeholder="Descrição da cena (opcional)"
          value={descricao}
          onChange={e => onDescricaoChange(e.target.value)}
        />
      )}
      {/* Gravação de áudio */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded-full ${gravando ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white'}`}
            title={gravando ? 'Gravando...' : 'Gravar áudio'}
            onClick={gravando ? stopRecording : startRecording}
            disabled={takes.length >= 3}
          >
            <span role="img" aria-label="microfone">🎤</span>
          </button>
          {gravando && <span className="text-red-600 font-mono"> Gravando... {tempo}s</span>}
          {!gravando && takes.length < 3 && <span className="text-gray-400 text-sm">Máx. 3 takes</span>}
        </div>
        <div className="flex flex-col gap-2">
          {takes.map((take, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white rounded p-2 border">
              <span className="font-mono text-xs">Take {String(idx + 1).padStart(2, '0')}</span>
              <audio ref={audioRef} src={take.url} controls className="h-8" />
              <span className="text-xs text-gray-500">{take.duracao}s</span>
              <button className="text-red-500 ml-2" onClick={() => deleteTake(idx)} title="Deletar">
                ✖
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [projeto, setProjeto] = useState<string | null>(null)
  const [script, setScript] = useState('')
  // Divisão automática em sessões (parágrafos não vazios)
  const paragrafos = script
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  // Estado para cada sessão: texto e descrição
  const [sessoes, setSessoes] = useState<{ texto: string; descricao: string }[]>([])

  // Sincronizar sessões com parágrafos do script
  // (mantém descrições já digitadas)
  React.useEffect(() => {
    setSessoes(prev => {
      const novas = paragrafos.map((p, i) => ({
        texto: p,
        descricao: prev[i]?.descricao || '',
      }))
      return novas
    })
    // eslint-disable-next-line
  }, [script])

  function handleSessaoChange(idx: number, texto: string) {
    setSessoes(s => s.map((sessao, i) => i === idx ? { ...sessao, texto } : sessao))
  }
  function handleDescricaoChange(idx: number, descricao: string) {
    setSessoes(s => s.map((sessao, i) => i === idx ? { ...sessao, descricao } : sessao))
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Header />
      {!projeto ? (
        <ProjetoForm onCreate={setProjeto} />
      ) : (
        <>
          <div className="mb-4 text-gray-600">Projeto: <b>{projeto}</b></div>
          <ScriptPrincipal value={script} onChange={setScript} />
          <div>
            {sessoes.length === 0 && (
              <div className="bg-gray-100 rounded p-6 text-center text-gray-400">
                Cole seu script para gerar sessões…
              </div>
            )}
            {sessoes.map((sessao, idx) => (
              <Sessao
                key={idx}
                index={idx}
                value={sessao.texto}
                onChange={texto => handleSessaoChange(idx, texto)}
                descricao={sessao.descricao}
                onDescricaoChange={desc => handleDescricaoChange(idx, desc)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App
