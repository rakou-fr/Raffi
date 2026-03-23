// VideoGenerator.jsx
// Bouton + état pour générer la vidéo MP4 depuis les 4 slides

import { useState, useRef } from 'react'
import { generateVideo }    from '../slides/generateVideo.js'
import { Spinner }          from './Spinner.jsx'

export function VideoGenerator({ slideUrls, itemId }) {
  const [status,    setStatus]    = useState('')      // message d'état
  const [progress,  setProgress]  = useState(0)       // 0-100
  const [videoUrl,  setVideoUrl]  = useState(null)    // blob URL du MP4
  const [loading,   setLoading]   = useState(false)
  const [audioFile, setAudioFile] = useState(null)    // fichier MP3 uploadé
  const audioRef  = useRef(null)

  const handleGenerate = async () => {
    if (loading) return
    setLoading(true)
    setVideoUrl(null)
    setProgress(0)
    setStatus('')

    try {
      const url = await generateVideo(
        slideUrls,
        audioFile,
        (p) => setProgress(p),
        (s) => setStatus(s)
      )
      setVideoUrl(url)
      setStatus('✅ Vidéo prête !')
    } catch (e) {
      setStatus(`⚠ Erreur : ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href     = videoUrl
    a.download = `carousel_${itemId}.mp4`
    a.click()
  }

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-white/5 mt-1">

      {/* Upload MP3 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => audioRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold
            bg-white/4 hover:bg-white/8 text-white/40 hover:text-white/70 border border-white/8
            hover:border-white/20 transition-all"
        >
          🎵 {audioFile ? audioFile.name.substring(0, 16) + '…' : 'Ajouter musique'}
        </button>
        {audioFile && (
          <button
            onClick={() => setAudioFile(null)}
            className="text-white/20 hover:text-white/50 text-xs transition-colors"
          >
            ✕
          </button>
        )}
        <input
          ref={audioRef}
          type="file"
          accept=".mp3,audio/*"
          className="hidden"
          onChange={e => setAudioFile(e.target.files[0] || null)}
        />
      </div>

      {/* Bouton générer vidéo */}
      {!videoUrl && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold
            bg-white/6 hover:bg-white/10 text-white/60 hover:text-white/90
            border border-white/10 hover:border-white/25 disabled:opacity-40
            transition-all active:scale-95"
        >
          {loading
            ? <><Spinner size={11} /> {status || 'Génération…'}</>
            : '🎬 Générer vidéo MP4'
          }
        </button>
      )}

      {/* Progress bar */}
      {loading && progress > 0 && (
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Vidéo prête */}
      {videoUrl && (
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold
              bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30
              transition-all active:scale-95"
          >
            ⬇ Télécharger MP4
          </button>
          <button
            onClick={() => { setVideoUrl(null); setProgress(0); setStatus('') }}
            className="px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 border border-white/8 hover:border-white/20 transition-all"
            title="Regénérer"
          >
            ↺
          </button>
        </div>
      )}

      {/* Status message */}
      {status && !loading && (
        <p className="text-[10px] text-white/30 text-center">{status}</p>
      )}
    </div>
  )
}