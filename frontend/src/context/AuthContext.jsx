import { useContext, createContext, useCallback, useEffect, useRef, useState } from "react";
import { login as loginService, logout as logoutService, getCurrentUser, pingAttendanceLocation } from "../services/authService.js";
import api from "../services/api.js";

export const AuthContext = createContext(null);

const getBrowserLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error("This browser does not support GPS location."));
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => reject(new Error(error.code === 1 ? "Location permission is required. Please allow location access in your browser." : "Unable to get your GPS location. Please enable location services and try again.")),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
});

const setLocationHeaders = (location) => {
  sessionStorage.setItem("insideSalesLocation", JSON.stringify(location));
  api.defaults.headers.common["x-user-latitude"] = String(location.latitude);
  api.defaults.headers.common["x-user-longitude"] = String(location.longitude);
};

const clearLocation = () => {
  sessionStorage.removeItem("insideSalesLocation");
  delete api.defaults.headers.common["x-user-latitude"];
  delete api.defaults.headers.common["x-user-longitude"];
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchId = useRef(null);
  const locationFailureHandled = useRef(false);

  const stopLocationWatch = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const forceLocationLogout = useCallback(async (message) => {
    if (locationFailureHandled.current) return;
    locationFailureHandled.current = true;
    stopLocationWatch();
    try { await logoutService(); } catch { /* clear local session even if network is unavailable */ }
    clearLocation();
    setUser(null);
    window.alert(message || "GPS location is unavailable. You have been logged out for security.");
  }, [stopLocationWatch]);

  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation || watchId.current !== null) return;
    locationFailureHandled.current = false;
    watchId.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      const location = { latitude: coords.latitude, longitude: coords.longitude };
      setLocationHeaders(location);
      try {
        await pingAttendanceLocation();
      } catch (error) {
        const code = error.response?.data?.code;
        if (code === "OUTSIDE_GEOFENCE" || code === "LOCATION_REQUIRED" || code === "ATTENDANCE_CLOSED") {
          await forceLocationLogout(error.response?.data?.message || "You are outside the permitted office area.");
        }
      }
    }, async () => {
      await forceLocationLogout("Location access was lost. Inside Sales access has been stopped and you have been logged out.");
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }, [forceLocationLogout]);

  const checkAuth = useCallback(async () => {
    try {
      let cached = null;
      try { cached = JSON.parse(sessionStorage.getItem("insideSalesLocation") || "null"); } catch { clearLocation(); }
      if (cached) setLocationHeaders(cached);
      const response = await getCurrentUser();
      if (response.success && response.user) {
        if (response.user.role === "inside_sales") {
          const freshLocation = await getBrowserLocation();
          setLocationHeaders(freshLocation);
          await pingAttendanceLocation();
          startLocationWatch();
        }
        setUser(response.user);
      } else setUser(null);
    } catch (error) {
      if (error.response?.data?.code === "OUTSIDE_GEOFENCE" || error.response?.data?.code === "LOCATION_REQUIRED") clearLocation();
      setUser(null);
    } finally { setLoading(false); }
  }, [startLocationWatch]);

  useEffect(() => {
    checkAuth();
    return () => stopLocationWatch();
  }, [checkAuth, stopLocationWatch]);

  const login = async (email, password) => {
    let coordinates = null;
    // The backend requires GPS coordinates only for Inside Sales accounts.
    // Request location before authentication to ensure the server makes the access decision.
    try { coordinates = await getBrowserLocation(); }
    catch (error) {
      // Other roles are not subject to the office geofence; retry login without GPS.
      const response = await loginService(email, password, null);
      setUser(response.user);
      return response;
    }
    const response = await loginService(email, password, coordinates);
    if (!response.success || !response.user) throw new Error(response.message || "Login failed");
    if (response.user.role === "inside_sales") {
      setLocationHeaders(coordinates);
      startLocationWatch();
    } else clearLocation();
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    stopLocationWatch();
    try { await logoutService(); } finally { clearLocation(); setUser(null); }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
