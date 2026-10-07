"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { derive, type AuctionEvent, type BidderId, type Snapshot } from "@/lib/auction";
import { deriveAlerts, type Alert } from "./alerts";
import { computeOffset } from "./clock";
import { nextMode, shouldAccept } from "./connection";
import { useNow } from "./useNow";

export type Connection = "connecting" | "live" | "reconnecting" | "paused";
export type QueuedAlert = { id: number; alert: Alert | { kind: "notice"; text: string } };
export type DispatchResult = { ok: true } | { ok: false; reason: string };

const IDLE_POLL_MS = 30_000;
const SNAPSHOT_URL = "/api/auction";
const STREAM_URL = "/api/auction/stream";

let alertSeq = 0;

export function useAuction(me: BidderId | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [alerts, setAlerts] = useState<QueuedAlert[]>([]);
  const snapshotRef = useRef<Snapshot | null>(null);
  const offsetRef = useRef(0);
  const reconcileRef = useRef<() => void>(() => {});

  const pushAlerts = useCallback((items: QueuedAlert["alert"][]) => {
    if (items.length === 0) return;
    setAlerts((q) => [...q, ...items.map((alert) => ({ id: ++alertSeq, alert }))]);
  }, []);

  const apply = useCallback(
    (incoming: Snapshot, source: "self" | "remote") => {
      const prev = snapshotRef.current;
      if (!shouldAccept(prev?.auction ?? null, incoming.auction)) return;
      offsetRef.current = computeOffset(incoming.now, Date.now());
      const fresh = deriveAlerts(prev, incoming, me, source);
      snapshotRef.current = incoming;
      setSnapshot(incoming);
      pushAlerts(fresh);
      reconcileRef.current();
    },
    [me, pushAlerts],
  );

  useEffect(() => {
    let disposed = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const statusNow = () => {
      const s = snapshotRef.current;
      return s ? derive(s.auction, Date.now() + offsetRef.current).status : null;
    };

    const fetchOnce = async () => {
      try {
        const r = await fetch(SNAPSHOT_URL, { cache: "no-store" });
        if (r.ok) apply((await r.json()) as Snapshot, "remote");
      } catch {
        // keep the last snapshot; the state machine retries
      }
    };

    const closeStream = () => {
      es?.close();
      es = null;
    };
    const stopPoll = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    };
    const openStream = () => {
      if (es) return;
      es = new EventSource(STREAM_URL);
      es.addEventListener("snapshot", (ev) => {
        apply(JSON.parse((ev as MessageEvent).data) as Snapshot, "remote");
        setConnection("live");
      });
      es.onopen = () => setConnection("live");
      es.onerror = () => {
        if (statusNow() === "ended") {
          closeStream();
          reconcile();
        } else {
          setConnection("reconnecting");
        }
      };
    };

    const reconcile = () => {
      if (disposed) return;
      const mode = nextMode(!document.hidden, statusNow());
      if (mode === "hidden") {
        closeStream();
        stopPoll();
        setConnection("paused");
      } else if (mode === "idle-poll") {
        if (es) return; // keep an open stream until the server closes it
        if (!pollTimer) pollTimer = setInterval(fetchOnce, IDLE_POLL_MS);
        setConnection("paused");
      } else {
        stopPoll();
        openStream();
      }
    };
    reconcileRef.current = reconcile;

    const onVisibility = () => {
      if (document.hidden) reconcile();
      else void fetchOnce().then(reconcile);
    };
    document.addEventListener("visibilitychange", onVisibility);

    void fetchOnce().then(reconcile);

    // ended-by-clock: re-evaluate the mode once per second so an auction that
    // ends with no new snapshot still moves to idle-poll after the stream closes
    const tick = setInterval(reconcile, 1_000);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(tick);
      closeStream();
      stopPoll();
    };
  }, [apply]);

  const dispatch = useCallback(
    async (event: AuctionEvent): Promise<DispatchResult> => {
      try {
        const r = await fetch(SNAPSHOT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        if (r.status === 409) {
          const again = await fetch(SNAPSHOT_URL, { cache: "no-store" });
          if (again.ok) apply((await again.json()) as Snapshot, "remote");
          return { ok: false, reason: "Someone bid at the same time, try again" };
        }
        if (!r.ok) return { ok: false, reason: "Could not reach the auction" };
        const data = (await r.json()) as {
          ok: boolean;
          reason?: string;
          auction: Snapshot["auction"];
          now: number;
        };
        apply({ auction: data.auction, now: data.now }, "self");
        return data.ok ? { ok: true } : { ok: false, reason: data.reason ?? "Bid rejected" };
      } catch {
        return { ok: false, reason: "Could not reach the auction" };
      }
    },
    [apply],
  );

  const dismissAlert = useCallback(
    (id: number) => setAlerts((q) => q.filter((a) => a.id !== id)),
    [],
  );
  const pushNotice = useCallback(
    (text: string) => pushAlerts([{ kind: "notice", text }]),
    [pushAlerts],
  );

  const now = useNow(offsetRef);
  const derived = snapshot ? derive(snapshot.auction, now) : null;

  return { snapshot, derived, now, connection, alerts, dismissAlert, pushNotice, dispatch };
}
