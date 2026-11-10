interface Window {
  __arena?: {
    racers: () => number;
    phase: () => string;
    ranking: () => string[];
    boosts: () => { id: string; giftBoost: number; turboUntil: number; likeBursts: number }[];
  };
}
