"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Loader2, MapPin, LogOut, Eye, EyeOff, Ghost, RotateCw, Pause, ZoomOut } from "lucide-react";

export function Overlay({
    onAddLocation,
    isAutoRotating = true,
    onToggleRotation,
    onResetZoom
}: {
    onAddLocation: (location: string) => void;
    isAutoRotating?: boolean;
    onToggleRotation?: () => void;
    onResetZoom?: () => void;
}) {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [locationInput, setLocationInput] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const handleAddLocation = async () => {
        if (!locationInput) return;
        setLoading(true);
        // Determine lat/lng from location string (e.g. using a geocoding API or simple mock for now)
        // For this prototype, we'll try to find coordinates via a free API or just ask user for City
        // A simple free geocoding is OpenStreetMap Nominatim

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];

                // Send to our API
                const saveRes = await fetch("/api/pins", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lat: parseFloat(lat),
                        lng: parseFloat(lon),
                        location: locationInput,
                        isAnonymous,
                    }),
                });

                if (saveRes.ok) {
                    onAddLocation(locationInput);
                    setLocationInput("");
                    alert("Location added!");
                } else {
                    const err = await saveRes.json();
                    alert(`Failed to save location: ${err.error || "Unknown error"}`);
                }
            } else {
                alert("Location not found. Try a major city or region.");
            }
        } catch (e) {
            console.error(e);
            alert("Error adding location.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLocation = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pins", {
                method: "DELETE",
            });
            if (res.ok) {
                onAddLocation("delete"); // Trigger refresh
                alert("Location deleted!");
            } else {
                alert("Failed to delete location.");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting location.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return null;

    return (
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-4 pointer-events-auto">
            {/* Reset Zoom Button */}
            {onResetZoom && (
                <button
                    onClick={onResetZoom}
                    className="bg-black/40 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-white/10 transition-all shadow-lg"
                    title="Reset Zoom"
                >
                    <ZoomOut size={20} />
                </button>
            )}

            {/* Toggle Rotation Button */}
            {onToggleRotation && (
                <button
                    onClick={onToggleRotation}
                    className={`backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-white/10 transition-all shadow-lg ${isAutoRotating ? 'bg-blue-600/80 animate-pulse' : 'bg-black/40'}`}
                    title={isAutoRotating ? "Pause Rotation" : "Auto Rotate"}
                >
                    {isAutoRotating ? <Pause size={20} /> : <RotateCw size={20} />}
                </button>
            )}

            {/* Toggle Visibility Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-black/40 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-white/10 transition-all shadow-lg"
                title={isVisible ? "Hide UI" : "Show UI"}
            >
                {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            {isVisible && (
                !session ? (
                    <button
                        onClick={() => signIn("discord")}
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                        Login with Discord
                    </button>
                ) : (
                    <div className="bg-[#000000] text-white p-6 rounded-xl border border-white/10 shadow-2xl flex flex-col gap-6 min-w-[320px]">
                        <div className="flex flex-col items-center border-b border-white/10 pb-6">
                            <img src={session.user?.image || ""} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white/10 mb-3 shadow-lg" />

                            <div className="flex flex-col items-center gap-1">
                                <span className="font-bold text-xl">{session.user?.name}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Connected via Discord</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold text-center">Manage Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="City, Region (e.g. Paris)"
                                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                                />
                                <button
                                    onClick={handleAddLocation}
                                    disabled={loading}
                                    title="Update Location"
                                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isAnonymous ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/20'}`}>
                                    {isAnonymous && <Ghost size={14} />}
                                </div>
                                <span className="text-sm text-gray-300 select-none">Hide Identity (Anonymous)</span>
                            </div>

                            <button
                                onClick={handleDeleteLocation}
                                disabled={loading}
                                className="w-full py-2 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} className="rotate-180" /> {/* Reusing icon for visual hint if desired, or simple text */}
                                Remove my location
                            </button>

                            <p className="text-[10px] text-gray-600 text-center leading-relaxed px-2">
                                Your location is approximate. We randomly shift coordinates slightly for privacy.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors py-2 hover:bg-white/5 rounded-lg text-sm"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
