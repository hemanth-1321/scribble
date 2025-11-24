"use client";
import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import { Crown, Play, Users, Pencil, ArrowRight } from "lucide-react";
import { createRoom } from "@/lib/actions/rooms";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname first!");
      return;
    }

    setIsLoading(true);

    const response = await createRoom(nickname);

    toast.success(`Room created: ${response.room_id}`);
    localStorage.setItem("playerId", response.player.id);
    // Redirect to the room
    router.push(`/room/${response.room_id}`);

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 font-sans">
      {/* Sonner Toaster Positioned here */}
      <Toaster position="top-center" richColors closeButton />

      {/* Main Card */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-4 border-black/10">
        {/* Header / Logo Area */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-full shadow-lg animate-bounce">
              <Pencil className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              Sketch<span className="text-yellow-300">It.io</span>
            </h1>
            <p className="text-indigo-200 font-medium">Draw, Guess, Win!</p>
          </div>
        </div>

        {/* Inputs Area */}
        <div className="p-8 space-y-6">
          {/* Avatar & Name Input Group */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
              Choose your Nickname
            </label>
            <div className="flex gap-3">
              {/* Random Avatar Placeholder */}
              <div className="w-14 h-14 bg-yellow-200 rounded-xl shrink-0 border-2 border-yellow-400 flex items-center justify-center text-2xl shadow-sm">
                👾
              </div>
              <input
                type="text"
                placeholder="e.g. ArtMaster99"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 bg-gray-50 border-2 border-gray-200 text-gray-900 text-lg rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 transition-all outline-none font-bold placeholder:font-normal"
              />
            </div>
          </div>

          <div className="h-px bg-gray-200 w-full my-4"></div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black py-4 px-6 rounded-xl shadow-[0_4px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-0.5 transition-all active:shadow-none active:translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed text-xl"
            >
              {isLoading ? (
                <span className="animate-pulse">Creating...</span>
              ) : (
                <>
                  <Crown className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Create Private Room
                </>
              )}
            </button>

            <button className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all">
              <Users className="w-5 h-5" />
              Join Existing Room
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
          v2.0 • Made for fun
        </div>
      </div>
    </div>
  );
};

export default page;
