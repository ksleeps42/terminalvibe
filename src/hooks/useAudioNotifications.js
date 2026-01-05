import { useEffect, useRef, useCallback } from 'react';
import { audioSynth } from '../utils/audioSynth';

/**
 * Hook to play audio notifications when agent statuses change
 *
 * @param {Array} agents - Array of agent objects with id and status properties
 * @param {boolean} enabled - Whether audio notifications are enabled
 */
export function useAudioNotifications(agents, enabled = true) {
  // Track previous statuses to detect changes
  const prevStatusesRef = useRef({});
  const initializedRef = useRef(false);

  // Update the synth enabled state
  useEffect(() => {
    audioSynth.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    // Skip on first render to avoid playing sounds when app loads
    if (!initializedRef.current) {
      // Initialize previous statuses without playing sounds
      prevStatusesRef.current = agents.reduce((acc, agent) => {
        acc[agent.id] = agent.status;
        return acc;
      }, {});
      initializedRef.current = true;
      return;
    }

    const prevStatuses = prevStatusesRef.current;

    // Check each agent for status changes
    agents.forEach(agent => {
      const prevStatus = prevStatuses[agent.id];
      const currentStatus = agent.status;

      // Only trigger on actual status CHANGE (not initial load)
      // Only play sound for needs-attention (red) state
      if (prevStatus !== undefined && prevStatus !== currentStatus) {
        if (currentStatus === 'needs-attention') {
          audioSynth.playStatusSound(currentStatus);
        }
      }
    });

    // Update previous statuses for next comparison
    prevStatusesRef.current = agents.reduce((acc, agent) => {
      acc[agent.id] = agent.status;
      return acc;
    }, {});
  }, [agents]);

  // Return methods to manually trigger sounds
  const playAttention = useCallback(() => {
    audioSynth.playAttentionTone();
  }, []);

  const playReady = useCallback(() => {
    audioSynth.playReadyTone();
  }, []);

  const playWorking = useCallback(() => {
    audioSynth.playWorkingTone();
  }, []);

  return {
    playAttention,
    playReady,
    playWorking,
    setEnabled: audioSynth.setEnabled.bind(audioSynth),
    setVolume: audioSynth.setVolume.bind(audioSynth),
  };
}

export default useAudioNotifications;
