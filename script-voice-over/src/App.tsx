import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import WaveSurfer from 'wavesurfer.js'

function Header() {
  return (
    <header className="w-full max-w-3xl mx-auto flex items-center py-12 px-8 mb-8 relative">
      <h1 className="text-6xl font-bold text-left flex-1">Script Voice Over</h1>
      <button className="absolute right-8 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200/20 transition-colors" title="Configurações">
        <span role="img" aria-label="settings" className="text-2xl">⚙️</span>
      </button>
    </header>
  )
}

function ProjetoForm({ onCreate }: { onCreate: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <form className="projeto-form" onSubmit={e => { e.preventDefault(); if (nome) onCreate(nome) }}>
      <input
        className="projeto-form-input"
        placeholder="Nome do Projeto"
        value={nome}
        onChange={e => setNome(e.target.value)}
        required
      />
      <button className="projeto-form-btn" type="submit">Criar Projeto</button>
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

function Waveform({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#888',
      progressColor: '#000',
      height: 40,
      barWidth: 2,
      responsive: true,
    })
    wavesurfer.load(url)
    return () => {
      wavesurfer.destroy()
    }
  }, [url])
  return <div ref={containerRef} className="w-full" />
}

// Utilitário para salvar arquivo usando File System Access API
async function salvarArquivo(caminho: string[], blob: Blob) {
  // Solicita acesso à pasta Downloads na primeira vez
  // (ou reusa o handle se já existir)
  if (!window['rootDirHandle']) {
    // @ts-ignore
    window['rootDirHandle'] = await window.showDirectoryPicker({ id: 'script-voice-over-root' });
  }
  let dirHandle = window['rootDirHandle'];
  // Cria subpastas conforme o caminho
  for (let i = 0; i < caminho.length - 1; i++) {
    dirHandle = await dirHandle.getDirectoryHandle(caminho[i], { create: true });
  }
  const fileHandle = await dirHandle.getFileHandle(caminho[caminho.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function Sessao({
  index,
  value,
  onChange,
  descricao,
  onDescricaoChange,
  projetoNome,
}: {
  index: number
  value: string
  onChange: (v: string) => void
  descricao: string
  onDescricaoChange: (v: string) => void
  projetoNome: string
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
      timerRef.current = window.setInterval(() => setTempo(t => t + 1), 1000)
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

  async function saveTakeToDisk(blob: Blob, takeIdx: number) {
    const sessaoPasta = `Sessao_${String(index + 1).padStart(2, '0')}`;
    const takeNome = `take_${String(takeIdx + 1).padStart(2, '0')}.webm`;
    await salvarArquivo([projetoNome, sessaoPasta, takeNome], blob);
  }

  function stopRecording() {
    mediaRecorder?.stop()
    setGravando(false)
  }

  useEffect(() => {
    // Sempre que um novo take for adicionado, salvar no disco
    if (takes.length > 0) {
      const ultimo = takes[takes.length - 1];
      saveTakeToDisk(ultimo.blob, takes.length - 1);
    }
    // eslint-disable-next-line
  }, [takes])

  function deleteTake(idx: number) {
    setTakes(tks => tks.filter((_, i) => i !== idx))
  }

  return (
    <div className="sessao-box">
      <div className="sessao-tabs">
        <button
          className={`tab-btn${aba === 'script' ? ' active' : ''}`}
          onClick={() => setAba('script')}
        >
          Script
        </button>
        <button
          className={`tab-btn${aba === 'descricao' ? ' active' : ''}`}
          onClick={() => setAba('descricao')}
        >
          Descrição de Cena
        </button>
      </div>
      {aba === 'script' ? (
        <textarea
          className="script-principal-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <textarea
          className="script-principal-textarea"
          placeholder="Descrição da cena (opcional)"
          value={descricao}
          onChange={e => onDescricaoChange(e.target.value)}
        />
      )}
      {/* Gravação de áudio */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="sessao-audio-row">
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
            <div key={idx} className="take-box">
              <div className="audio-info">
                <span className="take-label">Take {String(idx + 1).padStart(2, '0')}</span>
                <audio ref={audioRef} src={take.url} controls />
                <span className="take-duration">{take.duracao}s</span>
              </div>
              <button className="delete-btn" onClick={() => deleteTake(idx)} title="Deletar">
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
    <div className="min-h-screen bg-[#222] text-white flex flex-col">
      <Header />
      {!projeto ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="centralize-form-google">
            <ProjetoForm onCreate={setProjeto} />
          </div>
        </div>
      ) : (
        <div className="main-project-container">
          <div className="projeto-title mb-4">Projeto: <b className="text-white">{projeto}</b></div>
          <ScriptPrincipal value={script} onChange={setScript} />
          <div>
            {sessoes.length === 0 && (
              <div className="bg-gray-100 rounded p-6 text-center text-gray-400">
                Cole seu script para gerar sessões…
              </div>
            )}
            {sessoes.map((sessao, idx) => (
              <div className="sessao-container" key={idx}>
                <Sessao
                  index={idx}
                  value={sessao.texto}
                  onChange={texto => handleSessaoChange(idx, texto)}
                  descricao={sessao.descricao}
                  onDescricaoChange={desc => handleDescricaoChange(idx, desc)}
                  projetoNome={projeto!}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
