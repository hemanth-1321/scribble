"use client";

import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Crown,
  Users,
  Pencil,
  Sparkles,
  Palette,
  ArrowRight,
} from "lucide-react";
import { createRoom } from "@/lib/actions/rooms";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname first!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await createRoom(nickname);
      toast.success(`Room created: ${response.room_id}`);
      localStorage.setItem("playerId", response.player.id);
      router.push(`/room/${response.room_id}`);
    } catch (error) {
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh relative bg-slate-50 overflow-hidden flex items-center justify-center p-4 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Toaster position="top-center" richColors closeButton />

      {/* --- Decorative Background Elements --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Abstract Gradients */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-200/40 blur-3xl mix-blend-multiply animate-blob" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-200/40 blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />

        {/* Floating Icons Pattern */}
        <div className="absolute top-10 left-10 text-indigo-300/50 -rotate-12">
          <Palette size={48} />
        </div>
        <div className="absolute bottom-20 left-20 text-purple-300/50 rotate-12">
          <Pencil size={32} />
        </div>
        <div className="absolute top-1/4 right-10 text-pink-300/50 rotate-45">
          <Sparkles size={40} />
        </div>
      </div>

      {/* --- Main Card --- */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white overflow-hidden ring-1 ring-gray-900/5 transition-transform duration-300 hover:scale-[1.01]">
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-linear-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-2 transform transition-transform hover:rotate-6">
            <Pencil className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Sketch
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">
                It
              </span>
              .io
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              Draw. Guess. Win.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-10 space-y-8">
          {/* Input Group */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 ml-1">
              Choose your Artist Name
            </label>
            <div className="relative flex items-center group">
              <div className="absolute left-3 w-10 h-10 bg-linear-to-br from-yellow-200 to-orange-300 rounded-full flex items-center justify-center text-xl shadow-sm border border-white z-10 pointer-events-none">
                👾
              </div>
              <input
                type="text"
                placeholder="e.g. PicassoJr"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="group w-full relative overflow-hidden bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 text-yellow-400 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-lg">Create Private Room</span>
                    <ArrowRight className="w-5 h-5 opacity-0 -ml-4 group-hover:ml-0 group-hover:opacity-100 transition-all duration-300" />
                  </>
                )}
              </div>

              {/* Button sheen effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/50 backdrop-blur-sm px-2 text-gray-400 font-medium">
                  Or
                </span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 group">
              <Users className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
              <span>Join Existing Room</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/50 border-t border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs font-medium tracking-wide">
            v2.0 • MADE FOR FUN
          </p>
        </div>
      </div>
    </div>
  );
}
