"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { useResize } from "./useResize";
import ReactDOMServer from "react-dom/server"; // Use client-side rendering for complex interactive elements if possible, or simple HTML string
// react-globe.gl htmlElement helper often needs a raw DOM element.

export function World({ pins }: { pins?: any[] }) {
    const globeEl = useRef<GlobeMethods | undefined>(undefined);
    const { width, height } = useResize();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Auto-rotate
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    if (!mounted) return null;

    // Custom HTML marker render function
    const renderHtmlMarker = (d: any) => {
        const el = document.createElement('div');
        el.innerHTML = `
      <div class="pin-container" style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative;">
        
        <!-- Tooltip -->
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
            display: none; /* Controlled by CSS hover */
            flex-direction: column; 
            align-items: center; 
            pointer-events: none; 
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 50;
        ">
            <span style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${d.username}</span>
            <span style="font-size: 11px; color: #aaa;">${d.location || 'Unknown'}</span>
            
            <!-- Arrow -->
            <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid rgba(0,0,0,0.95);"></div>
        </div>

        <div class="pin-avatar" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; overflow: hidden; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.5); transition: all 0.2s ease;">
          <img src="${d.avatar_url}" alt="${d.username}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="width: 2px; height: 16px; background: rgba(255,255,255,0.8);"></div>
      </div>
    `;

        el.onclick = () => console.log(`Clicked ${d.username}`);
        return el;
    };

    return (
        <div className="absolute inset-0 z-0">
            <Globe
                ref={globeEl}
                width={width}
                height={height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

                atmosphereColor="#3a228a"
                atmosphereAltitude={0.2}

                htmlElementsData={pins || []}
                htmlLat="lat"
                htmlLng="lng"
                htmlElement={renderHtmlMarker}
            />
        </div>
    );
}
