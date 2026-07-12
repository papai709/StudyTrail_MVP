import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Reusable Brick Component
const Brick = ({ className = "" }) => (
  <div 
    className={`h-10 bg-[#8B2500] border-t-2 border-l-2 border-b-4 border-r-4 border-t-[#b03a15] border-l-[#b03a15] border-b-[#4a1200] border-r-[#4a1200] rounded-xs shadow-sm ${className}`} 
  />
);

const Working = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0914] text-white p-4 relative overflow-hidden">
      
      {/* Floating Header Card */}
      <div className="z-10 text-center mb-16 mt-8 bg-black/40 p-8 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
          We're Building This Page
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Our digital masons are currently laying the foundation. Check back soon for the finished product!
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all text-sm font-medium hover:-translate-x-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Safety
        </button>
      </div>

      {/* The Construction Scene */}
      <div className="relative w-full max-w-3xl h-64 flex items-end justify-center border-b-4 border-[#1a1a1a]">
        
        {/* === THE WALL (Unfinished) === */}
        {/* The background of this container acts as the gray mortar between bricks */}
        <div className="flex flex-col gap-2 p-2 bg-[#9ca3af] rounded-t-md shadow-2xl relative">
          
          {/* Row 5 (Top - Very Unfinished) */}
          <div className="flex gap-2 justify-start w-full px-4">
            <Brick className="w-24" />
          </div>

          {/* Row 4 (Unfinished) */}
          <div className="flex gap-2 justify-end w-full pr-12">
            <Brick className="w-24" />
            <Brick className="w-16" />
          </div>

          {/* Row 3 */}
          <div className="flex gap-2">
            <Brick className="w-12" />
            <Brick className="w-24" />
            <Brick className="w-24" />
            <Brick className="w-12" />
          </div>

          {/* Row 2 */}
          <div className="flex gap-2">
            <Brick className="w-24" />
            <Brick className="w-24" />
            <Brick className="w-24" />
          </div>

          {/* Row 1 (Bottom) */}
          <div className="flex gap-2">
            <Brick className="w-12" />
            <Brick className="w-24" />
            <Brick className="w-24" />
            <Brick className="w-12" />
          </div>

          {/* Dripping Wet Cement Details */}
          <div className="absolute top-16 left-16 w-3 h-8 bg-[#9ca3af] rounded-b-full"></div>
          <div className="absolute top-28 right-24 w-2 h-6 bg-[#9ca3af] rounded-b-full"></div>
        </div>

        {/* === LEFT SIDE: Iron Mason Bowl with Cement === */}
        <div className="absolute bottom-0 left-[5%] md:left-[15%] translate-y-0.5">
          <svg width="90" height="60" viewBox="0 0 90 60" className="drop-shadow-2xl">
            {/* Cement Mound (Overflowing) */}
            <path d="M 15 30 Q 45 5 75 30" fill="#9ca3af" />
            {/* Wet Cement Shine */}
            <ellipse cx="45" cy="22" rx="15" ry="4" fill="#cbd5e1" opacity="0.4" />
            
            {/* Iron Bowl Rim */}
            <ellipse cx="45" cy="30" rx="40" ry="8" fill="#4b5563" />
            <ellipse cx="45" cy="30" rx="36" ry="6" fill="#9ca3af" /> {/* Cement inside */}
            
            {/* Iron Bowl Body */}
            <path d="M 5 30 C 5 60, 85 60, 85 30 Z" fill="#1f2937" />
            <path d="M 10 32 C 10 55, 80 55, 80 32 Z" fill="#111827" />
          </svg>
        </div>

        {/* === LEFT SIDE: Brick Trowel (FIXED) === */}
        <div className="absolute bottom-6 left-[15%] md:left-[22%] rotate-25 drop-shadow-xl z-10">
          <svg width="80" height="40" viewBox="0 0 80 40">
            {/* Metal Blade (Classic Mason Trowel Shape) */}
            <path d="M 5 20 Q 30 5 45 10 L 45 30 Q 30 35 5 20 Z" fill="#cbd5e1" />
            <path d="M 5 20 Q 30 5 45 10 L 45 20 L 10 20 Z" fill="#f8fafc" opacity="0.3" /> {/* Blade Highlight */}
            <path d="M 5 20 Q 30 35 45 30 L 45 20 L 10 20 Z" fill="#94a3b8" opacity="0.5" /> {/* Blade Shadow */}

            {/* Arched Metal Stem/Neck */}
            <path d="M 40 20 Q 50 5 60 20" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

            {/* Metal Ferrule (Connector Ring) */}
            <rect x="58" y="16" width="4" height="8" rx="1" fill="#94a3b8" />

            {/* Wooden Handle */}
            <rect x="62" y="15" width="16" height="10" rx="3" fill="#8b4513" />
            <rect x="62" y="18" width="16" height="2" fill="#5c2b0b" opacity="0.4" /> {/* Wood grain detail */}
          </svg>
        </div>

        {/* === RIGHT SIDE: Scattered & Split Bricks === */}
        <div className="absolute bottom-0 right-[5%] md:right-[15%]">
          {/* Whole brick resting on the ground */}
          <Brick className="w-20 absolute bottom-0 right-14 rotate-[-8deg] drop-shadow-xl" />
          
          {/* Split / Broken Bricks */}
          <Brick className="w-10 absolute bottom-3 right-0 rotate-35 drop-shadow-xl" />
          <Brick className="w-12 absolute bottom-0 -right-8 rotate-12 drop-shadow-xl" />
          
          {/* Wet cement glob dropped on the ground */}
          <div className="absolute bottom-0 right-28 w-8 h-3 bg-[#9ca3af] rounded-full drop-shadow-md"></div>
          
          {/* Little brick rubble/dust pieces */}
          <div className="absolute bottom-1 right-24 w-2 h-2 bg-[#8B2500] rounded-sm"></div>
          <div className="absolute bottom-4 right-10 w-1.5 h-1.5 bg-[#b03a15] rounded-sm rotate-45"></div>
          <div className="absolute bottom-2 -right-12 w-2 h-2 bg-[#4a1200] rounded-sm"></div>
        </div>

      </div>
    </div>
  );
};

export default Working;