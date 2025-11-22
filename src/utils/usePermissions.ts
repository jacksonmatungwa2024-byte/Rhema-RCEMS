"use client";

import { useState } from "react";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export function usePermissions() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>("prompt");
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>("prompt");
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>("prompt");
  const [micStatus, setMicStatus] = useState<PermissionStatus>("prompt");

  // 🔔 Notifications
  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationStatus(result as PermissionStatus);
    if (result === "granted") {
      new Notification("Karibu Lumina Outreach System ✨");
    }
  };

  // 📍 Geolocation
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus("granted"),
      () => setLocationStatus("denied")
    );
  };

  // 🎥 Camera
  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus("granted");
    } catch {
      setCameraStatus("denied");
    }
  };

  // 🎙 Microphone
  const requestMicrophone = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
  };

  return {
    notificationStatus,
    locationStatus,
    cameraStatus,
    micStatus,
    requestNotifications,
    requestLocation,
    requestCamera,
    requestMicrophone,
  };
}
