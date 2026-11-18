import { playConfiguredAlarm, playStoneClick } from '../services/audioService';
import { AlarmSoundType } from '../types/ikariam';

export function playClickWrapper(muted: boolean) {
  playStoneClick(muted);
}

export function playConfiguredAlarmSafe(sound: AlarmSoundType, muted: boolean) {
  playConfiguredAlarm(sound, muted);
}
