import { useEffect, useRef, useState } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

type MicOptions = {
  segmentMs?: number;
  enabled?: boolean;
  onSegment?: (uri: string) => void;
};

export function useMicSegmenter({ segmentMs = 5000, enabled = false, onSegment }: MicOptions) {
  const arpRef = useRef<AudioRecorderPlayer | null>(null);
  const timerRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  async function startOnce() {
    if (!arpRef.current) arpRef.current = new AudioRecorderPlayer();
    try {
      setIsRecording(true);
      const uri = await arpRef.current.startRecorder();
      timerRef.current = setTimeout(async () => {
        try {
          const out = await arpRef.current?.stopRecorder();
          setIsRecording(false);
          if (onSegment && out) onSegment(out);
          if (enabled) startOnce();
        } catch (e) {
          setIsRecording(false);
        }
      }, segmentMs);
    } catch (e) {
      setIsRecording(false);
    }
  }

  useEffect(() => {
    if (enabled) startOnce();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (arpRef.current) {
        try { arpRef.current.stopRecorder(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, segmentMs]);

  return { isRecording };
}
