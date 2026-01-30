"use client";

import { motion } from "framer-motion";

interface PinProps {
    avatarUrl: string;
    username: string;
    location?: string;
}

export function Pin({ avatarUrl, username, location }: PinProps) {
    return (
        <div className="relative flex flex-col items-center group cursor-pointer">
            {/* Tooltip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute bottom-full mb-2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none backdrop-blur-sm border border-white/20"
            >
                <p className="font-bold">{username}</p>
                {location && <p className="text-[10px] text-gray-300">{location}</p>}
            </motion.div>

            {/* Pin Body */}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-125 z-10 relative">
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            </div>

            {/* Pin Tail/Needle */}
            <div className="w-0.5 h-4 bg-white/80 mt-[-1px] shadow-sm"></div>
        </div>
    );
}
