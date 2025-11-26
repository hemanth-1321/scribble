"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { useState } from "react";
import { joinRoom } from "@/lib/actions/rooms";
import { toast } from "sonner";

const JoinRoom = ({ roomId }: { roomId: string }) => {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    setLoading(true);

    try {
      const res = await joinRoom(roomId, nickname);

      // SAFETY CHECK - handle the actual response structure
      if (!res || !res.success || !res.players || !Array.isArray(res.players)) {
        console.error("Invalid response structure:", res);
        throw new Error("Invalid response from server");
      }

      // Get the last player (most recently added)
      const newPlayer = res.players[res.players.length - 1];

      if (!newPlayer || !newPlayer.id) {
        console.error("No player found in response:", res);
        throw new Error("Player not found in response");
      }

      // Store player ID
      localStorage.setItem("playerId", newPlayer.id);

      toast.success(`Joined as ${newPlayer.name}!`);

      // Force page reload to reinitialize with new playerId
      window.location.reload();
    } catch (err) {
      console.error("Join room error:", err);
      toast.error(err instanceof Error ? err.message : "Error joining room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              Enter your nickname to join the room.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="username-input">Username</Label>
              <Input
                id="username-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="john"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Joining..." : "Join Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoom;
