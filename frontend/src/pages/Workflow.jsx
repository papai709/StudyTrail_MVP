import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const Workflow = () => {
  return (
    <div className="relative w-full h-screen bg-[#0a051d] overflow-hidden">
      
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            
            {/* UI Controls Wrapper
                w-full and flex justify-center guarantees absolute horizontal centering.
                pointer-events-none prevents this invisible full-width box from blocking mouse clicks on the image.
            */}
            <div className="absolute bottom-8 w-full flex justify-center z-10 pointer-events-none">
              
              {/* The actual control panel (pointer-events-auto makes the buttons clickable again) */}
              <div className="flex gap-4 bg-black/50 p-2 rounded-lg backdrop-blur-sm shadow-lg pointer-events-auto">
                <button 
                  onClick={() => zoomOut()} 
                  className="w-10 h-10 flex justify-center items-center bg-white/10 text-white rounded hover:bg-white/20 transition-colors text-xl font-bold"
                  aria-label="Zoom Out"
                >
                  -
                </button>
                <button 
                  onClick={() => resetTransform()} 
                  className="px-4 h-10 flex justify-center items-center bg-white/10 text-white rounded hover:bg-white/20 transition-colors font-semibold"
                >
                  Reset
                </button>
                <button 
                  onClick={() => zoomIn()} 
                  className="w-10 h-10 flex justify-center items-center bg-[#6c23b5] text-white rounded hover:bg-[#5a1a9e] transition-colors text-xl font-bold"
                  aria-label="Zoom In"
                >
                  +
                </button>
              </div>
            </div>

            {/* The Image Wrapper */}
            <TransformComponent 
              wrapperStyle={{ width: "100vw", height: "100vh" }}
              contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <img 
                src="https://i.ibb.co/KMSmThS/Whats-App-Image-2026-07-05-at-1-24-40-PM.jpg" 
                alt="StudyTrail Workflow" 
                className="max-w-full max-h-screen object-contain p-4 cursor-grab active:cursor-grabbing"
              />
            </TransformComponent>
            
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default Workflow;