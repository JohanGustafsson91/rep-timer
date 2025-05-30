import { useState, useRef, useEffect } from "react";
import "./App.css";

function shouldMarkFirstRepImmediately({
  running,
  timeLeft,
  currentRep,
  totalSeconds,
}: {
  running: boolean;
  timeLeft: number;
  currentRep: number;
  totalSeconds: number;
}) {
  return running && currentRep === 0 && timeLeft === totalSeconds;
}

export default function App() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [reps, setReps] = useState(5);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentRep, setCurrentRep] = useState(0);
  const [running, setRunning] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(12);
  const [repTimeLeft, setRepTimeLeft] = useState(12);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    function calculateIntervalWhenInputChanges() {
      if (reps > 0) {
        const interval = Math.floor(totalSeconds / reps);
        setIntervalSeconds(interval);
        setRepTimeLeft(interval);
        setTimeLeft(totalSeconds);
        setCurrentRep(0);
        setRunning(false);
      }
    },
    [totalSeconds, reps],
  );

  // Timer logic
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0 || currentRep >= reps) {
      setRunning(false);
      setRepTimeLeft(0);
      return;
    }
    if (
      shouldMarkFirstRepImmediately({
        running,
        timeLeft,
        currentRep,
        totalSeconds,
      })
    ) {
      playBeep();
      setCurrentRep(1);
      setRepTimeLeft(intervalSeconds);
      setTimeLeft((t) => t - 1);
      return;
    }
    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => t - 1);
      setRepTimeLeft((r) => {
        if (r <= 1) {
          playBeep();
          // Only increment rep if not already at the last rep and not at the end
          if (currentRep < reps) {
            setCurrentRep(currentRep + 1);
          }
          return intervalSeconds;
        }
        return r - 1;
      });
    }, 1000);
    return () =>
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
  }, [
    running,
    timeLeft,
    repTimeLeft,
    currentRep,
    reps,
    intervalSeconds,
    totalSeconds,
  ]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(
        () => setCountdown((c) => (c !== null ? c - 1 : null)),
        1000,
      );
      return () => clearTimeout(t);
    } else if (countdown === 0) {
      setCountdown(null);
      setRunning(true);
    }
  }, [countdown]);

  useEffect(
    function warnBeforeReload() {
      const handler = (e: BeforeUnloadEvent) => {
        if (running) {
          e.preventDefault();
          e.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    },
    [running],
  );

  // Save/restore session state
  useEffect(() => {
    if (running) {
      localStorage.setItem(
        "reptimer-state",
        JSON.stringify({
          totalSeconds,
          reps,
          timeLeft,
          currentRep,
          repTimeLeft,
          running,
          intervalSeconds,
        }),
      );
    }
  }, [
    totalSeconds,
    reps,
    timeLeft,
    currentRep,
    repTimeLeft,
    running,
    intervalSeconds,
  ]);
  useEffect(() => {
    const saved = localStorage.getItem("reptimer-state");
    if (saved) {
      const s = JSON.parse(saved);
      setTotalSeconds(s.totalSeconds);
      setReps(s.reps);
      setTimeLeft(s.timeLeft);
      setCurrentRep(s.currentRep);
      setRepTimeLeft(s.repTimeLeft);
      setRunning(s.running);
      setIntervalSeconds(s.intervalSeconds);
    }
  }, []);

  // Start handler with countdown
  const handleStart = () => {
    setCountdown(3);
    setRunning(false);
    setCurrentRep(0);
    setTimeLeft(totalSeconds);
    setRepTimeLeft(intervalSeconds);
  };

  return (
    <div className="container">
      <h1>Reptimer</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStart();
        }}
        className="inputs"
      >
        <label>
          Total time (mm:ss):
          <input
            type="number"
            min={0}
            max={59}
            value={Math.floor(totalSeconds / 60)}
            onChange={(e) =>
              setTotalSeconds(Number(e.target.value) * 60 + (totalSeconds % 60))
            }
            disabled={running}
          />
          :
          <input
            type="number"
            min={0}
            max={59}
            value={totalSeconds % 60}
            onChange={(e) =>
              setTotalSeconds(
                Math.floor(totalSeconds / 60) * 60 + Number(e.target.value),
              )
            }
            disabled={running}
          />
        </label>
        <label>
          Reps:
          <input
            type="number"
            min={1}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            disabled={running}
          />
        </label>
        <button type="submit" disabled={running}>
          Start
        </button>
        <button
          type="button"
          onClick={() => setRunning(false)}
          disabled={!running}
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setTimeLeft(totalSeconds);
            setCurrentRep(0);
            setRepTimeLeft(intervalSeconds);
          }}
          disabled={running}
        >
          Reset
        </button>
      </form>
      {countdown !== null && (
        <div className="countdown">
          <span>{countdown > 0 ? countdown : "Go!"}</span>
        </div>
      )}
      <div className="timers">
        <div className="timer">
          <span>Total time left:</span>
          <span className="time">{formatTime(timeLeft)}</span>
        </div>
        <div className="timer">
          <span>Time to next rep:</span>
          <span
            className={repTimeLeft <= 3 && running ? "time warning" : "time"}
          >
            {formatTime(repTimeLeft)}
          </span>
        </div>
      </div>
      <div className="progress">
        <progress value={currentRep} max={reps}></progress>
        <span>
          Rep {Math.min(currentRep + 1, reps)} / {reps}
        </span>
      </div>
      <div className="reps">
        {Array.from({ length: reps }, (_, i) => (
          <span
            key={i}
            className={
              i < currentRep
                ? "rep done"
                : i === currentRep && running
                  ? "rep active"
                  : "rep"
            }
          >
            ●
          </span>
        ))}
      </div>
      {!running && (timeLeft === 0 || currentRep >= reps) && (
        <div className="session-end">
          <strong>Session complete!</strong>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    o.onended = () => ctx.close();
  } catch {
    // Ignore audio errors (e.g., user gesture required)
  }
}
