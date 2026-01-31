"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import Supercluster from "supercluster";
import { useResize } from "./useResize";

export function World({
    pins,
    isAutoRotating = true,
    resetZoomToken = 0
}: {
    pins?: any[],
    isAutoRotating?: boolean,
    resetZoomToken?: number
}) {
    const globeEl = useRef<GlobeMethods | undefined>(undefined);
    const { width, height } = useResize();

    // ...

    // Handle Reset Zoom
    useEffect(() => {
        if (resetZoomToken > 0 && globeEl.current) {
            globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
        }
    }, [resetZoomToken]);
    const [mounted, setMounted] = useState(false);
    const [clusters, setClusters] = useState<any[]>([]);

    // Altitude below which we force-disable clustering (show all pins)
    const CLUSTERING_ENABLED_ALTITUDE = 0.5;

    // Create supercluster instance
    const supercluster = useMemo(() => new Supercluster({
        radius: 60,
        maxZoom: 16,
    }), []);

    // Helper to map altitude to standard zoom levels (0-20)
    const getZoomFromAltitude = useCallback((altitude: number) => {
        // Heuristic: specific to react-globe.gl's altitude handling
        return Math.round(Math.max(0, Math.min(20, Math.log2(5 / Math.max(1e-6, altitude)))));
    }, []);

    const getAltitudeFromZoom = useCallback((zoom: number) => {
        return 5 / Math.pow(2, zoom);
    }, []);

    const updateClusters = useCallback(() => {
        if (!globeEl.current) return;

        const altitude = globeEl.current.pointOfView().altitude;
        const zoom = getZoomFromAltitude(altitude);

        // Strategy: Strict Threshold
        // If we are close enough (low altitude), show all pins individually.
        if (altitude <= CLUSTERING_ENABLED_ALTITUDE) {
            // Convert raw pins to the Feature format expected by renderHtmlMarker
            const allPinsAsFeatures = (pins || []).map(pin => ({
                type: "Feature",
                properties: {
                    cluster: false,
                    pinId: pin.id,
                    ...pin
                },
                geometry: {
                    type: "Point",
                    coordinates: [pin.lng, pin.lat]
                }
            }));
            setClusters(allPinsAsFeatures);
            return;
        }

        // Get clusters for the whole world view
        const bbox: [number, number, number, number] = [-180, -90, 180, 90];
        const newClusters = supercluster.getClusters(bbox, zoom);

        setClusters(newClusters);
    }, [pins, supercluster, getZoomFromAltitude]);

    // Load points into supercluster when pins change
    useEffect(() => {
        if (!pins) return;

        const points = pins.map(pin => ({
            type: "Feature" as const,
            properties: {
                cluster: false,
                pinId: pin.id,
                ...pin
            },
            geometry: {
                type: "Point" as const,
                coordinates: [pin.lng, pin.lat]
            }
        }));

        supercluster.load(points);
        updateClusters();
    }, [pins, supercluster, updateClusters]);

    useEffect(() => {
        setMounted(true);
        if (globeEl.current) {
            const controls = globeEl.current.controls();
            controls.autoRotate = isAutoRotating;
            controls.autoRotateSpeed = 0.5;

            // Listen to camera changes to update clusters
            controls.addEventListener('change', () => {
                // Throttle updates or just call directly (React batching helps)
                updateClusters();
            });
        }
    }, [updateClusters, isAutoRotating]);

    if (!mounted) return null;

    const handleClusterClick = (cluster: any) => {
        if (!globeEl.current) return;

        const { id, geometry } = cluster;
        const [lng, lat] = geometry.coordinates;

        // Zoom directly to an altitude that guarantees clustering is disabled
        // Target 40% of the threshold to be safe
        const newAltitude = CLUSTERING_ENABLED_ALTITUDE * 0.4;

        globeEl.current.pointOfView({ lat, lng, altitude: newAltitude }, 1000);
    };

    const renderHtmlMarker = (d: any) => {
        const isCluster = d.properties.cluster;

        const el = document.createElement('div');
        el.style.transform = 'translate(-50%, -50%)';
        el.style.pointerEvents = 'auto'; // Ensure clicks are captured
        el.style.cursor = 'pointer';

        if (isCluster) {
            const count = d.properties.point_count;
            const size = Math.min(60, 30 + (count / pins!.length) * 40); // Dynamic size

            el.innerHTML = `
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: rgba(88, 101, 242, 0.9);
                    border: 2px solid white;
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-family: sans-serif;
                    box-shadow: 0 0 15px rgba(88, 101, 242, 0.6);
                    transition: transform 0.2s;
                ">
                    ${count}
                </div>
            `;
            el.onclick = () => handleClusterClick(d);
            el.onmouseenter = () => { el.style.transform = 'translate(-50%, -50%) scale(1.1)'; };
            el.onmouseleave = () => { el.style.transform = 'translate(-50%, -50%) scale(1)'; };

        } else {
            // Individual Pin
            // d.properties contains the original pin data mixed in
            const pinData = d.properties;
            const isAnon = pinData.is_anonymous;
            const username = isAnon ? "Anonymous" : pinData.username;
            const avatarUrl = isAnon ? "https://cdn.discordapp.com/embed/avatars/0.png" : pinData.avatar_url;

            el.style.transform = 'translate(-50%, -100%)'; // Anchor bottom
            el.innerHTML = `
             <div class="pin-container" style="display: flex; flex-direction: column; align-items: center; position: relative;">
                
                <div class="pin-tooltip" style="
                    position: absolute; 
                    bottom: 100%; 
                    margin-bottom: 8px; 
                    background: rgba(0,0,0,0.95); 
                    color: white; 
                    padding: 8px 12px; 
                    border-radius: 8px; 
                    font-size: 12px; 
                    white-space: nowrap; 
                    display: none; 
                    flex-direction: column; 
                    align-items: center; 
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    z-index: 50;
                ">
                    <span style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${username}</span>
                    <span style="font-size: 11px; color: #aaa;">${pinData.location || 'Unknown'}</span>
                    <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid rgba(0,0,0,0.95);"></div>
                </div>

                <div class="pin-avatar" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; overflow: hidden; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                    <img src="${avatarUrl}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="width: 2px; height: 16px; background: rgba(255,255,255,0.8);"></div>
            </div>
            `;

            // We use JS events on the element because putting onclick in HTML string is messy with closure scope
            const container = el.querySelector('.pin-container') as HTMLElement;
            const tooltip = el.querySelector('.pin-tooltip') as HTMLElement;

            container.onmouseenter = () => {
                tooltip.style.display = 'flex';
                container.style.zIndex = '100';
            };
            container.onmouseleave = () => {
                tooltip.style.display = 'none';
                container.style.zIndex = 'auto';
            };
            el.onclick = () => console.log(`Clicked ${username}`);
        }

        return el;
    };

    return (
        <div className="absolute inset-0 z-0">
            <Globe
                ref={globeEl}
                width={width}
                height={height}
                globeImageUrl="/textures/8k_earth_daymap.jpg"
                bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                atmosphereColor="#3a228a"
                atmosphereAltitude={0.2}

                htmlElementsData={clusters}
                htmlLat={(d: any) => d.geometry.coordinates[1]}
                htmlLng={(d: any) => d.geometry.coordinates[0]}
                htmlElement={renderHtmlMarker}
            />
        </div>
    );
}
