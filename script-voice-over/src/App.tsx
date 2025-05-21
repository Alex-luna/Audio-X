import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import WaveSurfer from 'wavesurfer.js'
import audioBufferToWav from 'audiobuffer-to-wav'

// Modal de configurações de microfone
function MicrophoneSettingsModal({
  open,
  onClose,
  settings,
  setSettings,
  devices,
  restoreDefaults,
}: {
  open: boolean
  onClose: () => void
  settings: MicrophoneSettings
  setSettings: (s: MicrophoneSettings) => void
  devices: MediaDeviceInfo[]
  restoreDefaults: () => void
}) {
  if (!open) return null
  return (
    <div
      style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}
    >
      <div
        style={{background:'#23232b',padding:32,borderRadius:16,minWidth:320,maxWidth:400,color:'#fff',boxShadow:'0 4px 32px #0008',position:'relative'}}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{position:'absolute',top:12,right:16,fontSize:22,background:'none',border:'none',color:'#fff',cursor:'pointer'}}>✖</button>
        <h2 style={{marginBottom:24,fontSize:22}}>Configurações do Microfone</h2>
        <div style={{marginBottom:18}}>
          <label>Dispositivo:
            <select
              style={{width:'100%',marginTop:6,padding:8,borderRadius:8,background:'#18181f',color:'#fff',border:'1px solid #444'}}
              value={settings.deviceId}
              onChange={e => setSettings({...settings, deviceId: e.target.value})}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Microfone (${d.deviceId.slice(-4)})`}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{marginBottom:18}}>
          <label>Volume: {settings.volume}
            <input type="range" min={0} max={2} step={0.01} value={settings.volume} onChange={e => setSettings({...settings, volume: Number(e.target.value)})} style={{width:'100%'}} />
          </label>
        </div>
        <div style={{marginBottom:18}}>
          <label>Ganho: {settings.gain}
            <input type="range" min={0} max={4} step={0.01} value={settings.gain} onChange={e => setSettings({...settings, gain: Number(e.target.value)})} style={{width:'100%'}} />
          </label>
        </div>
        <div style={{marginBottom:18}}>
          <label>Equalizador:
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <span style={{fontSize:13}}>Graves</span>
              <input type="range" min={-10} max={10} step={1} value={settings.eqLow} onChange={e => setSettings({...settings, eqLow: Number(e.target.value)})} />
              <span style={{fontSize:13}}>Agudos</span>
              <input type="range" min={-10} max={10} step={1} value={settings.eqHigh} onChange={e => setSettings({...settings, eqHigh: Number(e.target.value)})} />
            </div>
          </label>
        </div>
        <div style={{marginBottom:18}}>
          <label>Pitch: {settings.pitch}
            <input type="range" min={0.5} max={2} step={0.01} value={settings.pitch} onChange={e => setSettings({...settings, pitch: Number(e.target.value)})} style={{width:'100%'}} />
          </label>
        </div>
        <div style={{marginBottom:18}}>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={settings.monitor} onChange={e => setSettings({...settings, monitor: e.target.checked})} />
            Retorno de áudio (monitoramento)
          </label>
        </div>
        <button onClick={restoreDefaults} style={{marginTop:12,padding:'8px 18px',borderRadius:8,background:'#444',color:'#fff',border:'none',fontWeight:600,cursor:'pointer'}}>Restaurar padrão</button>
      </div>
    </div>
  )
}

// Tipos para configurações
interface MicrophoneSettings {
  deviceId: string
  volume: number
  gain: number
  eqLow: number
  eqHigh: number
  pitch: number
  monitor: boolean
}

function Header({onOpenSettings}:{onOpenSettings:()=>void}) {
  return (
    <header className="w-full max-w-3xl mx-auto flex items-center py-12 px-8 mb-8 relative">
      <h1 className="text-6xl font-bold text-left flex-1">Script Voice Over</h1>
      <button className="absolute right-8 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200/20 transition-colors" title="Configurações" onClick={onOpenSettings}>
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
  const w = window as Window & { rootDirHandle?: any };
  if (!w.rootDirHandle) {
    // @ts-ignore
    w.rootDirHandle = await window.showDirectoryPicker({ id: 'script-voice-over-root' });
  }
  let dirHandle = w.rootDirHandle;
  // Cria subpastas conforme o caminho
  for (let i = 0; i < caminho.length - 1; i++) {
    dirHandle = await dirHandle.getDirectoryHandle(caminho[i], { create: true });
  }
  const fileHandle = await dirHandle.getFileHandle(caminho[caminho.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// Utilitário para gerar CSV das sessões
function gerarCSV(sessoes: { texto: string; descricao: string }[]) {
  const linhas = [
    ['Sessão', 'Script', 'Descrição de Cena'],
    ...sessoes.map((sessao, idx) => [
      `Sessao_${String(idx + 1).padStart(2, '0')}`,
      sessao.texto.replace(/\n/g, ' '),
      sessao.descricao.replace(/\n/g, ' '),
    ]),
  ]
  return linhas.map(linha => linha.map(campo => '"' + campo.replace(/"/g, '""') + '"').join(',')).join('\r\n')
}

function Sessao({
  index,
  value,
  onChange,
  descricao,
  onDescricaoChange,
  projetoNome,
  micSettings,
}: {
  index: number
  value: string
  onChange: (v: string) => void
  descricao: string
  onDescricaoChange: (v: string) => void
  projetoNome: string
  micSettings: MicrophoneSettings
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
  // Web Audio
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const eqLowRef = useRef<BiquadFilterNode | null>(null)
  const eqHighRef = useRef<BiquadFilterNode | null>(null)
  const pitchNodeRef = useRef<WaveShaperNode | null>(null)
  const monitorRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Adicionar ref para pitch no player
  const pitchRef = useRef<number>(micSettings.pitch)

  async function startRecording() {
    if (takes.length >= 3) return;
    // Selecionar device
    const constraints: MediaStreamConstraints = {
      audio: { deviceId: micSettings.deviceId ? { exact: micSettings.deviceId } : undefined }
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    streamRef.current = stream
    // Web Audio pipeline
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioCtx
    let source = audioCtx.createMediaStreamSource(stream)
    sourceRef.current = source
    // Gain
    const gainNode = audioCtx.createGain()
    gainNode.gain.value = micSettings.gain * micSettings.volume
    gainNodeRef.current = gainNode
    // Equalizador
    const eqLow = audioCtx.createBiquadFilter()
    eqLow.type = 'lowshelf'
    eqLow.frequency.value = 200
    eqLow.gain.value = micSettings.eqLow
    eqLowRef.current = eqLow
    const eqHigh = audioCtx.createBiquadFilter()
    eqHigh.type = 'highshelf'
    eqHigh.frequency.value = 3000
    eqHigh.gain.value = micSettings.eqHigh
    eqHighRef.current = eqHigh
    // Pitch (simples: playbackRate não afeta MediaStream, então ignorado na gravação, mas pode ser aplicado no player)
    // Monitoramento
    let dest = audioCtx.createMediaStreamDestination()
    monitorRef.current = dest
    // Encadeamento: source -> eqLow -> eqHigh -> gain -> dest
    source.connect(eqLow)
    eqLow.connect(eqHigh)
    eqHigh.connect(gainNode)
    gainNode.connect(dest)
    // Monitoramento (retorno)
    if (micSettings.monitor) {
      const monitorOut = audioCtx.createMediaStreamDestination()
      gainNode.connect(monitorOut)
      const audio = new window.Audio()
      audio.srcObject = monitorOut.stream
      audio.play()
    }
    // Gravar a saída processada
    const recorder = new MediaRecorder(dest.stream)
    let localChunks: Blob[] = []
    recorder.ondataavailable = e => {
      if (e.data.size > 0) {
        localChunks.push(e.data)
      }
    }
    recorder.onstop = () => {
      if (timerRef.current) clearInterval(timerRef.current)
      const blob = new Blob(localChunks, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setTakes(tks => [...tks, { url, blob, duracao: tempo }].slice(0, 3))
      setTempo(0)
      // Cleanup
      stream.getTracks().forEach(t => t.stop())
      audioCtx.close()
    }
    setMediaRecorder(recorder)
    setGravando(true)
    setTempo(0)
    recorder.start()
    timerRef.current = window.setInterval(() => setTempo(t => t + 1), 1000)
  }

  async function saveTakeToDisk(blob: Blob, takeIdx: number) {
    const sessaoPasta = `Sessao_${String(index + 1).padStart(2, '0')}`;
    const takeNome = `take_${String(takeIdx + 1).padStart(2, '0')}.wav`;

    // Converte Blob webm para AudioBuffer
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Converte AudioBuffer para WAV
    const wavBuffer = audioBufferToWav(audioBuffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    await salvarArquivo([projetoNome, sessaoPasta, takeNome], wavBlob);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setGravando(false);
    }
  }

  useEffect(() => {
    // Sempre que um novo take for adicionado, salvar no disco
    if (takes.length > 0) {
      const ultimo = takes[takes.length - 1];
      saveTakeToDisk(ultimo.blob, takes.length - 1);
    }
    // eslint-disable-next-line
  }, [takes])

  useEffect(() => {
    pitchRef.current = micSettings.pitch
  }, [micSettings.pitch])

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
                <audio
                  ref={el => {
                    if (el) el.playbackRate = pitchRef.current
                  }}
                  src={take.url}
                  controls
                />
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
  // Modal de configurações
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([])
  const [micSettings, setMicSettings] = useState<MicrophoneSettings>({
    deviceId: '',
    volume: 1,
    gain: 1,
    eqLow: 0,
    eqHigh: 0,
    pitch: 1,
    monitor: false,
  })
  // Buscar dispositivos de microfone
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const mics = devs.filter(d => d.kind === 'audioinput')
      setMicDevices(mics)
      if (!micSettings.deviceId && mics.length > 0) {
        setMicSettings(s => ({...s, deviceId: mics[0].deviceId}))
      }
    })
    // eslint-disable-next-line
  }, [])

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

  // Função para restaurar configs
  function restoreMicDefaults() {
    setMicSettings(s => ({
      deviceId: micDevices[0]?.deviceId || '',
      volume: 1,
      gain: 1,
      eqLow: 0,
      eqHigh: 0,
      pitch: 1,
      monitor: false,
    }))
  }

  // Salvar CSV das sessões sempre que houver alteração
  useEffect(() => {
    if (!projeto) return;
    const csv = gerarCSV(sessoes);
    const blob = new Blob([csv], { type: 'text/csv' });
    salvarArquivo([projeto, 'sessoes.csv'], blob);
  }, [sessoes, projeto]);

  return (
    <div className="min-h-screen bg-[#222] text-white flex flex-col">
      <Header onOpenSettings={()=>setSettingsOpen(true)} />
      <MicrophoneSettingsModal open={settingsOpen} onClose={()=>setSettingsOpen(false)} settings={micSettings} setSettings={setMicSettings} devices={micDevices} restoreDefaults={restoreMicDefaults} />
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
                  micSettings={micSettings}
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
