export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="mb-4">
          <span className="font-display text-heading-md text-warm-800">
            looks good,{" "}
          </span>
          <span className="font-display text-heading-md text-warm-600">
            feels good
          </span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full bg-sage-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-warm-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blush-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
