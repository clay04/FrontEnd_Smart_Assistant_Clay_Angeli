import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Camera, useCameraDevices, PhotoFile } from 'react-native-vision-camera';

export type CameraStreamHandle = {
  takeSnapshot: () => Promise<string | null>;
  isReady: () => boolean;
};

type Props = {
  onReady?: () => void;
};

const CameraStream = forwardRef<CameraStreamHandle, Props>(({ onReady }, ref) => {
  //const devices = useCameraDevices();
  const devices: CameraDevice[] = useCameraDevices(); 

  //console.log("Available camera devices:", JSON.stringify(devices, null, 2)); //Log untuk mengetahui device kamera apa saja yang tersedia

  //const device = devices.back ?? devices.external;
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const camRef = useRef<Camera>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    async takeSnapshot() {
      if (!camRef.current || !ready) {
        console.warn("📷 Camera not ready yet");
        return null;
      }
      try {
        const photo: PhotoFile = await camRef.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
        });
        if (!photo?.path) return null;
        const fixedPath = photo.path.startsWith("file://")
          ? photo.path
          : "file://" + photo.path;
        console.log("📸 Snapshot taken:", fixedPath);
        return fixedPath;
      } catch (e) {
        console.warn("❌ takePhoto failed", e);
        return null;
      }
    },
    isReady() {
      return ready;
    },
  }));

  useEffect(() => {
    if (device) {
      setReady(true);
      onReady && onReady();
    }
  }, [device, onReady]);

  if (!device) {
    console.log("⚠️ No camera device found");
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "white" }}>⏳ Menunggu kamera siap...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        ref={camRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
    </View>
  );
});

export default CameraStream;

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
