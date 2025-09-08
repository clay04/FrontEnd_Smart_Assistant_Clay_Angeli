import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View } from 'react-native';
import CameraStream, {CameraStreamHandle} from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak } from '../../utils/tts';
import { useMicSegmenter } from '../../hog/useMicSegmenter';
import { uploadToBackend } from '../../utils/uploader';
import type { BackendResponse } from '../../types';

const BACKEND_ENDPOINT = 'http://192.168.1.53:5000/voice/assistant'; // IP Backend

const Home: React.FC = () => {
  const camRef = useRef<CameraStreamHandle>(null);
  const [permitted, setPermitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>('');
  const [micOn, setMicOn] = useState<boolean>(true);

  useMicSegmenter({
    segmentMs: 5000,
    enabled: micOn && permitted && camRef.current?.isReady() && !sending,
    onSegment: async (audioUri) => {
      if (!camRef.current?.isReady()) {
        console.log("⚠️ Skip snapshot: camera not ready");
        return;
      }

      const snap = await camRef.current.takeSnapshot();
      setLastPhoto(snap ?? null);

      try {
        setSending(true);
        const json: BackendResponse = await uploadToBackend(BACKEND_ENDPOINT, {
          photoPath: snap ?? undefined,
          audioPath: audioUri,
        });

        const resp = json.response || json.response_text || json.data || '';
        setLastText(resp || '');
        if (resp) speak(resp);
      } catch (e: any) {
        console.warn('Upload failed', e?.message || e);
      } finally {
        setSending(false);
      }
    },
  });

  const init = useCallback(async () => {
    const ok = await ensureAllPermissions();
    setPermitted(ok);
    await initTTS('id-ID');
    if (!ok) Alert.alert('Izin dibutuhkan', 'Aktifkan izin kamera dan mikrofon.');
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Assistant (Realtime)</Text>

      <CameraStream ref={camRef} />

      <View style={styles.row}>
        <Text style={[styles.badge, { backgroundColor: micOn ? '#dff7df' : '#ffecec' }]}>
          Mic: {micOn ? 'ON (segmented)' : 'OFF'}
        </Text>
      </View>

      <View style={styles.row}>
        <Button title={micOn ? 'Matikan Mic' : 'Nyalakan Mic'} onPress={() => setMicOn((v) => !v)} />
        <View style={{ width: 12 }} />
        <Button
          title="Ambil Foto Sekarang"
          onPress={async () => {
            if (!camRef.current?.isReady()) {
              Alert.alert("Kamera belum siap", "Tunggu kamera aktif dulu.");
              return;
            }
            const snap = await camRef.current.takeSnapshot();
            setLastPhoto(snap ?? null);
          }}
        />
      </View>

      {sending && (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>Mengirim ke backend...</Text>
        </View>
      )}

      <View style={styles.previewRow}>
        {lastPhoto ? (
          <Image source={{ uri: lastPhoto }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}><Text>Belum ada snapshot</Text></View>
        )}
      </View>

      {!!lastText && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Respons:</Text>
          <Text>{lastText}</Text>
        </View>
      )}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eee', fontSize: 12 },
  previewRow: { marginTop: 14, alignItems: 'center' },
  preview: { width: 240, height: 240, borderRadius: 8, resizeMode: 'cover' },
  placeholder: { width: 240, height: 240, borderRadius: 8, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
  responseBox: { marginTop: 16, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8 },
  responseLabel: { fontWeight: '700', marginBottom: 6 },
});