"use client";

import { useState, useEffect } from "react";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export function usePermissions() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>("prompt");
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>("prompt");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 🔔 Ask for Notifications
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

  // 📍 Ask for Geolocation
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus("granted");
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocationStatus("denied");
        console.error("⚠️ Location error:", err.message);
      }
    );
  };

  // 🔎 Initial check
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationStatus(Notification.permission as PermissionStatus);
    }
  }, []);

  return {
    notificationStatus,
    locationStatus,
    coords,
    requestNotifications,
    requestLocation,
  };
}
