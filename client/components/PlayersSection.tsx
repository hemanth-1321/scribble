"use client";

interface Player {
  id: string;
  name: string;
  points: number;
  emoji: string;
  isDrawing?: boolean;
}

interface Props {
  players: Player[];
}

export default function PlayersSection({ players }: Props) {
  return (
    <div className="w-64 bg-white rounded-2xl shadow-sm border flex flex-col shrink-0">
      <div className="p-4 border-b bg-indigo-50 rounded-t-2xl">
        <h3 className="font-bold text-indigo-900">
          Players ({players.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between p-2 rounded-lg ${
              p.isDrawing
                ? "bg-indigo-100 border border-indigo-300"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                {p.emoji}
              </div>
              <div>
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.points} pts</p>
              </div>
            </div>

            {p.isDrawing && (
              <div className="text-indigo-600 animate-pulse text-xs">✏️</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
