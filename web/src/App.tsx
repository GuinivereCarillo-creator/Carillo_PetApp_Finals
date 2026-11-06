import { useCallback, useEffect, useRef, useState } from "react";
import { loadBreeds, loadPhoto } from "./api";
import type { Answer, BreedList, PendingRequest } from "./types";

const photoPath = (breed: string): string => `/breed/${breed}/images/random`;

const buildOptions = (list: BreedList): string[] => {
  const names: string[] = [];

  Object.entries(list).forEach(([breed, subBreeds]) => {
    names.push(breed);
    subBreeds.forEach((subBreed) => names.push(`${breed}/${subBreed}`));
  });

  return names.sort((first, second) => first.localeCompare(second));
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong.";

const waitForImage = (url: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The photo could not be shown."));
    image.src = url;
  });

type JsonPanelProps = {
  endpoint: string;
  data: unknown;
  slow: boolean;
};

function JsonPanel({ endpoint, data, slow }: JsonPanelProps) {
  const shown = data ?? { status: "loading", endpoint };

  return (
    <div className="rounded-xl border border-pink-200/25 bg-violet-950/50 p-4">
      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-pink-200/70">
        <span>Waiting for the Dog API</span>
        <span className="flex items-center gap-1.5 normal-case tracking-normal text-pink-100/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-300" />
          {slow ? "slow response" : "request sent"}
        </span>
      </div>
      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-pink-100/80">
        {JSON.stringify(shown, null, 2)}
      </pre>
    </div>
  );
}

export default function App() {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [breed, setBreed] = useState("");
  const [photo, setPhoto] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);
  const loading = pending !== null;
  const showJson = loading && (slow || photo === "");

  const fetchBreeds = useCallback(async () => {
    setError("");
    setPending({ status: "loading", endpoint: "/breeds/list/all" });

    try {
      const data = await loadBreeds();
      setBreeds(buildOptions(data.message));
      setAnswer({ endpoint: "/breeds/list/all", data });
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setPending(null);
    }
  }, []);

  useEffect(() => {
    void fetchBreeds();
  }, [fetchBreeds]);

  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }

    const timer = window.setTimeout(() => setSlow(true), 1500);

    return () => window.clearTimeout(timer);
  }, [pending]);

  const fetchPhoto = useCallback(async (selected: string) => {
    const ticket = latestRequest.current + 1;
    latestRequest.current = ticket;
    setError("");
    setPending({ status: "loading", endpoint: photoPath(selected) });

    try {
      const data = await loadPhoto(selected);

      if (ticket !== latestRequest.current) {
        return;
      }

      await waitForImage(data.message);

      if (ticket !== latestRequest.current) {
        return;
      }

      setAnswer({ endpoint: photoPath(selected), data });
      setPhoto(data.message);
    } catch (caught) {
      if (ticket !== latestRequest.current) {
        return;
      }

      setError(messageOf(caught));
      setPhoto("");
    } finally {
      if (ticket === latestRequest.current) {
        setPending(null);
      }
    }
  }, []);

  const chooseBreed = (value: string) => {
    setBreed(value);

    if (!value) {
      latestRequest.current += 1;
      setPhoto("");
      setPending(null);
      return;
    }

    void fetchPhoto(value);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-5 px-4 py-10">
      <header className="text-center">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-pink-50 sm:text-4xl">
          Carillo Pet App
        </h1>
      </header>

      <section className="flex w-full max-w-[500px] flex-col gap-4 rounded-2xl border border-pink-200/30 bg-pink-200/10 p-3">
        <div className="flex flex-row gap-5">
          <label
            htmlFor="breed"
            className="text-[11px] uppercase tracking-[0.2em] text-pink-200/80"
          >
            Choose a breed
          </label>
          <select
            id="breed"
            value={breed}
            disabled={breeds.length === 0}
            onChange={(event) => chooseBreed(event.target.value)}
            className="select-caret w-full cursor-pointer rounded-lg border border-pink-200/30 bg-violet-950/60 px-4 py-3 pr-10 text-sm text-pink-50 outline-none transition focus:border-pink-200/70 focus:ring-2 focus:ring-pink-300/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {breeds.length === 0 ? "Loading breeds..." : "Breed"}
            </option>
            {breeds.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-pink-200/25 bg-violet-950/50">
          {breed && (
            <span className="absolute right-8 bottom-5 z-10 rounded-md border border-pink-200/30 bg-violet-950/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-pink-100/90">
              {breed}
            </span>
          )}

          <div className="flex aspect-[4/3] w-full items-center justify-center">
            {photo ? (
              <img
                src={photo}
                alt={`Photo of ${breed}`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  loading ? "opacity-40" : "opacity-100"
                }`}
              />
            ) : (
              <p className="px-6 text-center text-xs text-pink-100/60">
                The selected breed wll be shown here.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchPhoto(breed)}
          disabled={!breed || loading}
          className="w-full rounded-lg bg-pink-200 px-4 py-3 text-sm font-semibold text-violet-950 transition hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-100/60 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-pink-100/50"
        >New
        </button>

        {pending && showJson && (
          <JsonPanel
            endpoint={pending.endpoint}
            data={
              answer !== null && answer.endpoint === pending.endpoint
                ? answer.data
                : null
            }
            slow={slow}
          />
        )}

        {error && (
          <div className="rounded-lg border border-pink-300/40 bg-pink-500/15 px-4 py-3 text-xs text-pink-50">
            <span className="font-semibold">Error: </span>
            {error}
            <button
              type="button"
              onClick={() => void fetchBreeds()}
              className="ml-2 underline underline-offset-2 hover:text-white"
            >
              Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
