import { ActivityEvent } from './types';

const pollVoteTimestamps = new Map<string, number[]>();
const pollActivities = new Map<string, ActivityEvent[]>();
const pollPeakVelocity = new Map<string, number>();

export function recordVoteTimestamp(pollId: string, timestamp: number = Date.now()) {
  let tsList = pollVoteTimestamps.get(pollId);
  if (!tsList) {
    tsList = [];
    pollVoteTimestamps.set(pollId, tsList);
  }
  tsList.push(timestamp);
  if (tsList.length > 1000) tsList.shift();
}

export function getPollVelocity(pollId: string): {
  vpm: number;
  trend: 'increasing' | 'steady' | 'decreasing';
  peak: number;
} {
  const timestamps = pollVoteTimestamps.get(pollId) || [];
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const thirtySecAgo = now - 30000;
  const sixtySecAgo = now - 60000;

  const votesLastMin = timestamps.filter((t) => t >= oneMinAgo).length;
  const vpm = votesLastMin;

  const recentHalf = timestamps.filter((t) => t >= thirtySecAgo).length;
  const priorHalf = timestamps.filter((t) => t >= sixtySecAgo && t < thirtySecAgo).length;

  let trend: 'increasing' | 'steady' | 'decreasing' = 'steady';
  if (recentHalf > priorHalf + 1) trend = 'increasing';
  else if (recentHalf < priorHalf - 1) trend = 'decreasing';

  let currentPeak = pollPeakVelocity.get(pollId) || 0;
  if (vpm > currentPeak) {
    currentPeak = vpm;
    pollPeakVelocity.set(pollId, currentPeak);
  }

  return { vpm, trend, peak: currentPeak };
}

export function addPollActivity(pollId: string, activity: ActivityEvent) {
  let list = pollActivities.get(pollId);
  if (!list) {
    list = [];
    pollActivities.set(pollId, list);
  }
  list.unshift(activity);
  if (list.length > 50) list.pop();
}

export function getPollActivities(pollId: string): ActivityEvent[] {
  return pollActivities.get(pollId) || [];
}

export function calculateVotesOverTime(
  pollId: string,
  createdTime: number,
  totalVotes: number
): Array<{ time: string; count: number; cumulative: number }> {
  const timestamps = (pollVoteTimestamps.get(pollId) || []).slice();
  const now = Date.now();
  const bucketsCount = 6;
  const bucketDuration = Math.max(60000, Math.ceil((now - createdTime) / bucketsCount));
  const votesOverTime: Array<{ time: string; count: number; cumulative: number }> = [];
  let runningTotal = 0;

  for (let i = 0; i < bucketsCount; i++) {
    const bucketStart = createdTime + i * bucketDuration;
    const bucketEnd = bucketStart + bucketDuration;
    const countInBucket = timestamps.filter((t) => t >= bucketStart && t < bucketEnd).length;
    runningTotal += countInBucket;
    const timeLabel = new Date(bucketEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    votesOverTime.push({
      time: timeLabel,
      count: countInBucket,
      cumulative: runningTotal,
    });
  }

  if (runningTotal === 0 && totalVotes > 0) {
    votesOverTime[votesOverTime.length - 1] = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: totalVotes,
      cumulative: totalVotes,
    };
  }

  return votesOverTime;
}
