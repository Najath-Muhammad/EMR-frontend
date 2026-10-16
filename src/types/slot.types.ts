import { SaveScheduleInput } from './schedule.types';

export type SlotUnavailableReason =
  | 'PAST_TIME'
  | 'BOOKED'
  | 'BREAK'
  | 'OUTSIDE_SESSION';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  reason?: SlotUnavailableReason;
  slotDuration: number;
}

export interface DaySlotsSummary {
  doctor: {
    id: string;
    name: string;
    specialization?: string;
    department?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  date: string;
  dayOfWeek: string;
  slotDuration: number;
  totalSlots: number;
  availableSlots: number;
  slots: TimeSlot[];
}

export interface PreviewSlotsInput {
  schedule: SaveScheduleInput;
  date: string;
  timezone?: string;
}
