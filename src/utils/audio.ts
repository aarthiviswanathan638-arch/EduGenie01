// EduGenie Voice Tutor Audio Player utility

let currentAudio: HTMLAudioElement | null = null;
let isSpeakingGlobal = false;
let onEndCallback: (() => void) | null = null;

export async function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  stopSpeaking();

  isSpeakingGlobal = true;
  onEndCallback = () => {
    isSpeakingGlobal = false;
    onEnd?.();
  };

  onStart?.();

  // Clean markdown syntax for speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#>[\]()]/g, '')
    .slice(0, 450);

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: 'Kore' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        currentAudio = new Audio(audioUrl);
        currentAudio.onended = () => {
          onEndCallback?.();
          currentAudio = null;
        };
        currentAudio.onerror = (e) => {
          console.warn('Audio playback error, falling back to Web Speech', e);
          fallbackWebSpeech(cleanText, onEndCallback);
        };
        await currentAudio.play();
        return;
      }
    }

    // Fallback to browser SpeechSynthesis
    fallbackWebSpeech(cleanText, onEndCallback);
  } catch (err) {
    console.warn('Gemini TTS fetch error, falling back to Web Speech', err);
    fallbackWebSpeech(cleanText, onEndCallback);
  }
}

function fallbackWebSpeech(text: string, onEnd?: (() => void) | null) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (isSpeakingGlobal && onEndCallback) {
    onEndCallback();
  }
  isSpeakingGlobal = false;
}

export function isCurrentlySpeaking() {
  return isSpeakingGlobal;
}
