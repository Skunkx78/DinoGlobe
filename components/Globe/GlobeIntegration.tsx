"use client";

import { useState, useEffect, useCallback } from "react";
import { World } from "@/components/Globe/World";
import { Overlay } from "@/components/UI/Overlay";

export default function GlobeIntegration() {
    const [pins, setPins] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchPins = useCallback(async () => {
        try {
            const res = await fetch("/api/pins");
            if (res.ok) {
                const data = await res.json();
                setPins(data);
            }
        } catch (error) {
            console.error("Failed to fetch pins:", error);
        }
    }, []);

    useEffect(() => {
        fetchPins();
    }, [fetchPins, refreshKey]);

    return (
        <>
            <Overlay onAddLocation={() => setRefreshKey(k => k + 1)} />
            <World pins={pins} />
        </>
    );
}
