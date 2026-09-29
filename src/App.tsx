import { useCallback, useEffect, useMemo, useState } from 'react'
import { AudioLines, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clipboard, Clock3, Headphones, Mic2, Pause, Play, RotateCcw, Settings2, Sparkles, Square, Volume2, Waves, X } from 'lucide-react'
import { parseReadingUnits, wordCount } from './services/textParser'
import { getVoices, isSpeechSupported } from './services/ttsService'
import { DEFAULT_SETTINGS, type ReaderSettings, type SpeechVoice } from './types/reader'
import { useReader } from './hooks/useReader'

const STORAGE_KEY = 'lop-doc-reader-settings-v1'
const TEXT_KEY = 'lop-doc-reader-text-v1'
const DEMO = 'An toàn thông tin là một lĩnh vực quan trọng. Nó giúp bảo vệ dữ liệu của người dùng. Hãy đọc thật chậm và ghi lại những ý chính vào vở.'
const PRESETS = [
  { name: 'Chép chậm', rate: 0.7, repeatCount: 2, pauseSeconds: 8, icon: '🐢' },
  { name: 'Chép bình thường', rate: 0.85, repeatCount: 1, pauseSeconds: 5, icon: '✍️' },
  { name: 'Ôn bài', rate: 1, repeatCount: 1, pauseSeconds: 2, icon: '📖' },
]

function loadSettings(): ReaderSettings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } } catch { return DEFAULT_SETTINGS }
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>
}
function App() {
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings)
  const [text, setText] = useState(() => { try { return localStorage.getItem(TEXT_KEY) ?? '' } catch { return '' } })
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const supported = isSpeechSupported()
  const units = useMemo(() => parseReadingUnits(text, settings.splitMode, settings.chunkSize), [text, settings.splitMode, settings.chunkSize])
  const activeVoice = voices.find((item) => item.voice.voiceURI === settings.voiceURI)?.voice ?? voices.find((item) => /^vi(-|$)/i.test(item.voice.lang))?.voice
  const reader = useReader({ units, text, settings, voice: activeVoice })
  const update = useCallback(<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => setSettings((old) => ({ ...old, [key]: value })), [])

  useEffect(() => {
    const refresh = () => setVoices(getVoices())
    refresh()
    if (supported) window.speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => { if (supported) window.speechSynthesis.removeEventListener('voiceschanged', refresh) }
  }, [supported])
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) }, [settings])
  useEffect(() => { try { if (settings.rememberText) localStorage.setItem(TEXT_KEY, text); else localStorage.removeItem(TEXT_KEY) } catch { /* storage may be disabled */ } }, [text, settings.rememberText])

  const onKeys = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.matches('textarea, input, select, [contenteditable="true"]')) return
    if (event.code === 'Space') { event.preventDefault(); if (reader.state === 'reading' || reader.state === 'waiting') reader.pause(); else if (reader.state === 'paused') reader.resume(); else reader.start() }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); reader.move(-1) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); reader.move(1) }
    else if (event.key.toLowerCase() === 'r') reader.replay()
    else if (event.key === 'Escape') reader.stop()
  }, [reader])
  useEffect(() => { window.addEventListener('keydown', onKeys); return () => window.removeEventListener('keydown', onKeys) }, [onKeys])

  const estimateMinutes = Math.max(1, Math.ceil(wordCount(text) / (settings.rate * 130)))
  const applyPreset = (preset: typeof PRESETS[number]) => setSettings((s) => ({ ...s, rate: preset.rate, repeatCount: preset.repeatCount, pauseSeconds: preset.pauseSeconds }))
  const pasteSample = () => setText(DEMO)
  const pasteClipboard = async () => { try { setText(await navigator.clipboard.readText()) } catch { document.querySelector<HTMLTextAreaElement>('#lesson-text')?.focus() } }
  const progress = units.length ? ((reader.index + (reader.state === 'finished' ? 1 : 0)) / units.length) * 100 : 0

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="TTS.LQS, trang chủ"><span className="brand-mark"><BookOpen size={20}/></span><span>TTS<span className="brand-dot">.</span>LQS</span></a><div className="topbar-right"><span className="top-note"><span className="live-dot"/> Công cụ học tập miễn phí</span><button className="icon-button help-button" title="Hướng dẫn phím tắt" aria-label="Hướng dẫn phím tắt" onClick={() => alert('Phím tắt: Space phát/tạm dừng · ←/→ câu trước/sau · R đọc lại · Esc dừng') }><CircleHelp size={19}/></button></div></header>
    <main id="top" className="main-wrap">
      <section className="intro"><div className="eyebrow"><Sparkles size={14}/> TRỢ LÝ ĐỌC CHÉP</div><h1>Biến bài học thành<br/><span>giờ chép bài nhẹ nhàng.</span></h1><p>Chọn nội dung, chỉnh nhịp đọc theo lớp học và để Lớp đọc đồng hành cùng các em.</p></section>
      {!supported && <div className="notice error-notice"><Mic2 size={18}/> Trình duyệt này chưa hỗ trợ SpeechSynthesis. Hãy thử mở bằng Chrome, Edge hoặc Safari mới nhất.</div>}
      {reader.error && <div className="notice error-notice"><Mic2 size={18}/>{reader.error}</div>}
      <div className="workspace-grid">
        <section className="left-column">
          <div className="card text-card">
            <div className="section-head"><div><span className="section-kicker">BƯỚC 1</span><h2>Nội dung bài đọc</h2></div><span className="soft-pill"><Waves size={14}/> Tiếng Việt</span></div>
            <textarea id="lesson-text" className="lesson-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán nội dung cần đọc vào đây..." aria-label="Nội dung bài đọc" />
            <div className="text-toolbar"><div className="text-stats"><span><strong>{text.length.toLocaleString('vi-VN')}</strong> ký tự</span><i/> <span><strong>{wordCount(text).toLocaleString('vi-VN')}</strong> từ</span><i/> <span><Clock3 size={13}/> ~{text ? estimateMinutes : 0} phút</span></div><div className="text-actions"><button className="text-button" onClick={() => setText('')}><X size={14}/> Xóa</button><button className="text-button" onClick={pasteSample}><Sparkles size={14}/> Văn bản mẫu</button><button className="text-button paste-button" onClick={pasteClipboard}><Clipboard size={14}/> Dán</button></div></div>
          </div>
          <div className="card preview-card">
            <div className="section-head preview-head"><div><span className="section-kicker">BƯỚC 2</span><h2>Xem trước bài đọc <span className="count-badge">{units.length}</span></h2></div><span className="preview-sub">Nhấn vào một đoạn để bắt đầu từ đó</span></div>
            {units.length ? <div className="preview-list" aria-label="Các đoạn trong bài đọc">{units.map((unit, i) => <button key={`${i}-${unit}`} className={`preview-unit ${reader.index === i && ['reading', 'waiting', 'paused'].includes(reader.state) ? 'active' : ''}`} onClick={() => reader.start(i)} aria-current={reader.index === i && ['reading', 'waiting', 'paused'].includes(reader.state) ? 'true' : undefined}><span className="unit-number">{String(i + 1).padStart(2, '0')}</span><span>{unit}</span><Play className="unit-play" size={15} fill="currentColor"/></button>)}</div> : <div className="empty-preview"><span className="empty-icon"><BookOpen size={22}/></span><strong>Bài đọc của bạn sẽ xuất hiện ở đây</strong><span>Nhập nội dung để xem cách bài được chia thành từng đoạn.</span></div>}
          </div>
        </section>
        <aside className="card settings-card">
          <div className="section-head"><div><span className="section-kicker">BƯỚC 3</span><h2>Cài đặt đọc</h2></div><Settings2 size={19} className="muted-icon"/></div>
          <div className="mode-switch" role="tablist" aria-label="Chế độ đọc"><button role="tab" aria-selected={settings.mode === 'teacher'} className={settings.mode === 'teacher' ? 'selected' : ''} onClick={() => update('mode', 'teacher')}><Headphones size={15}/> Giáo viên đọc chép</button><button role="tab" aria-selected={settings.mode === 'normal'} className={settings.mode === 'normal' ? 'selected' : ''} onClick={() => update('mode', 'normal')}><AudioLines size={15}/> Đọc liên tục</button></div>
          <div className="settings-body">
            <Field label="Giọng đọc" hint={!voices.some((v) => /^vi(-|$)/i.test(v.voice.lang)) ? 'Chưa tìm thấy giọng tiếng Việt trên thiết bị này.' : undefined}><div className="select-wrap"><select value={settings.voiceURI} onChange={(e) => update('voiceURI', e.target.value)} aria-label="Chọn giọng đọc"><option value="">{voices.some((v) => /^vi(-|$)/i.test(v.voice.lang)) ? 'Tự động · Ưu tiên tiếng Việt' : 'Giọng mặc định của trình duyệt'}</option>{voices.map((v) => <option key={v.voice.voiceURI} value={v.voice.voiceURI}>{v.label}</option>)}</select><ChevronDown size={15}/></div></Field>
            <Field label="Tốc độ đọc"><div className="range-row"><input type="range" min="0.5" max="2" step="0.05" value={settings.rate} onChange={(e) => update('rate', Number(e.target.value))} aria-label="Tốc độ đọc"/><span className="value-pill">{settings.rate.toFixed(2).replace(/0$/, '')}x</span></div><div className="range-caps"><span>Chậm</span><span>Nhanh</span></div></Field>
            <div className="preset-row" aria-label="Tốc độ nhanh">{[0.6, 0.75, 1, 1.25, 1.5].map((rate) => <button key={rate} className={settings.rate === rate ? 'active' : ''} onClick={() => update('rate', rate)}>{rate.toFixed(2).replace(/0$/, '')}x</button>)}</div>
            {settings.mode === 'teacher' && <div className="teacher-settings"><div className="divider-label"><span/><strong><Mic2 size={14}/> Chế độ giáo viên</strong><span/></div>
              <div className="two-fields"><Field label="Đọc mỗi"><div className="select-wrap"><select value={settings.splitMode} onChange={(e) => update('splitMode', e.target.value as ReaderSettings['splitMode'])}><option value="sentence">Câu</option><option value="punctuation">Dấu câu</option><option value="words">Số từ</option></select><ChevronDown size={15}/></div></Field><Field label="Đọc lại"><div className="select-wrap"><select value={settings.repeatCount} onChange={(e) => update('repeatCount', Number(e.target.value))}><option value={1}>1 lần</option><option value={2}>2 lần</option><option value={3}>3 lần</option></select><ChevronDown size={15}/></div></Field></div>
              {settings.splitMode === 'words' && <Field label="Số từ mỗi lần đọc"><div className="select-wrap"><select value={settings.chunkSize} onChange={(e) => update('chunkSize', Number(e.target.value))}>{[5, 8, 10, 15].map((n) => <option key={n} value={n}>{n} từ</option>)}</select><ChevronDown size={15}/></div></Field>}
              <div className="two-fields"><Field label="Nghỉ giữa lần đọc"><div className="select-wrap"><select value={settings.repeatPauseSeconds} onChange={(e) => update('repeatPauseSeconds', Number(e.target.value))}>{[1, 2, 3, 5, 8].map((n) => <option key={n} value={n}>{n} giây</option>)}</select><ChevronDown size={15}/></div></Field><Field label="Thời gian chép"><div className="select-wrap"><select value={settings.pauseSeconds} onChange={(e) => update('pauseSeconds', Number(e.target.value))}>{[1, 2, 3, 5, 8, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} giây</option>)}</select><ChevronDown size={15}/></div></Field></div>
              <div className="range-setting"><Volume2 size={15}/><span>Cao độ</span><input type="range" min="0.5" max="1.5" step="0.1" value={settings.pitch} onChange={(e) => update('pitch', Number(e.target.value))} aria-label="Cao độ giọng đọc"/><span>{settings.pitch.toFixed(1)}</span></div><div className="range-setting"><AudioLines size={15}/><span>Âm lượng</span><input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => update('volume', Number(e.target.value))} aria-label="Âm lượng giọng đọc"/><span>{Math.round(settings.volume * 100)}%</span></div>
            </div>}
          </div>
          <div className="quick-config"><div className="quick-heading"><span>CẤU HÌNH NHANH</span><span>Tùy chỉnh bất cứ lúc nào</span></div><div className="quick-presets">{PRESETS.map((p) => <button key={p.name} onClick={() => applyPreset(p)} className="quick-preset"><span>{p.icon}</span><span><strong>{p.name}</strong><small>{p.rate}x · {p.repeatCount} lần · nghỉ {p.pauseSeconds}s</small></span></button>)}</div><label className="remember-option"><input type="checkbox" checked={settings.rememberText} onChange={(e) => update('rememberText', e.target.checked)}/><span className="checkmark"><Check size={12}/></span><span>Nhớ nội dung trên thiết bị này</span></label></div>
        </aside>
      </div>
      <section className="playback-card" aria-label="Điều khiển phát"><div className="playback-info"><div className="play-status"><span className={`status-dot ${reader.state === 'reading' ? 'is-reading' : reader.state === 'waiting' || reader.state === 'paused' && reader.countdown > 0 ? 'is-waiting' : ''}`}/>{reader.state === 'reading' ? 'Đang đọc' : reader.state === 'waiting' ? 'Đang chờ học sinh chép...' : reader.state === 'paused' && reader.countdown > 0 ? 'Đã tạm dừng thời gian chép' : reader.state === 'paused' ? 'Đã tạm dừng' : reader.state === 'finished' ? 'Đã đọc xong' : reader.state === 'stopped' ? 'Đã dừng' : 'Sẵn sàng bắt đầu'}</div><div className="current-line">{units.length ? <>Đang đọc câu <strong>{Math.min(reader.index + 1, units.length)}</strong> / {units.length}{(reader.state === 'waiting' || reader.state === 'paused' && reader.countdown > 0) && <span className="countdown"> · Tiếp tục sau {reader.countdown} giây...</span>}</> : 'Thêm nội dung để bắt đầu bài đọc'}</div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div></div><div className="player-controls"><button className="round-control" onClick={() => reader.move(-1)} aria-label="Câu trước" title="Câu trước (←)" disabled={!units.length}><ChevronLeft size={21}/><ChevronLeft size={21} className="double-chevron"/></button>{reader.state === 'reading' || reader.state === 'waiting' ? <button className="main-play pause-control" onClick={reader.pause} aria-label="Tạm dừng" title="Tạm dừng (Space)"><Pause size={20} fill="currentColor"/></button> : reader.state === 'paused' ? <button className="main-play" onClick={reader.resume} aria-label="Tiếp tục" title="Tiếp tục (Space)"><Play size={20} fill="currentColor"/></button> : <button className="main-play" onClick={() => reader.start(reader.state === 'finished' ? 0 : reader.index)} aria-label="Bắt đầu đọc" title="Phát (Space)" disabled={!text.trim() || !supported}><Play size={20} fill="currentColor"/></button>}<button className="round-control stop-control" onClick={reader.stop} aria-label="Dừng đọc" title="Dừng (Esc)"><Square size={17} fill="currentColor"/></button><button className="round-control replay-control" onClick={reader.replay} aria-label="Đọc lại đoạn này" title="Đọc lại (R)" disabled={!units.length}><RotateCcw size={18}/></button><button className="round-control" onClick={() => reader.move(1)} aria-label="Câu tiếp" title="Câu tiếp (→)" disabled={!units.length}><ChevronRight size={21}/><ChevronRight size={21} className="double-chevron"/></button></div><div className="player-shortcut"><span><kbd>Space</kbd> phát / dừng</span><span><kbd>←</kbd><kbd>→</kbd> chuyển câu</span></div></section>
      <footer className="footer"><span>Được tạo cho những giờ học tập trung hơn.</span><span><span className="privacy-dot"/> Nội dung chỉ lưu trên thiết bị của bạn</span></footer>
    </main>
  </div>
}
export default App
