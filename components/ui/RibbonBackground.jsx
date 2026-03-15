import React from "react";

export default function RibbonBackground({ className = "", style = {} }) {
  return (
    <div className={`absolute inset-0 pointer-events-none -z-10 ${className}`} style={style}>
      <div className="absolute top-0 left-0 w-2/3 h-32 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 opacity-50 blur-xl rounded-full -rotate-12 animate-ribbon-move" />
      <div className="absolute bottom-0 right-0 w-2/3 h-32 bg-gradient-to-l from-pink-300 via-blue-300 to-indigo-300 opacity-40 blur-xl rounded-full rotate-6 animate-ribbon-move-delay" />
      <div className="absolute left-1/4 top-1/2 w-1/2 h-20 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 opacity-40 blur-xl rounded-full -rotate-6 animate-ribbon-move" />
      <style>{`
        @keyframes ribbon-move {
          0% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(10px) rotate(-8deg); }
          100% { transform: translateY(0) rotate(-12deg); }
        }
        .animate-ribbon-move {
          animation: ribbon-move 6s ease-in-out infinite;
        }
        .animate-ribbon-move-delay {
          animation: ribbon-move 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
