import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { tokenManager } from '../api/tokenManager';
import { Appointment } from '../types/appointment.types';

export interface RealtimeAppointmentPayload {
  action: 'CREATED' | 'UPDATED' | 'RESCHEDULED' | 'STATUS_CHANGED' | 'CANCELLED';
  appointment: Appointment;
  departmentId: string;
  doctorId: string;
  timestamp: string;
}

export interface RealtimeEventNotification {
  action: string;
  appointmentId: string;
  patientName?: string;
  doctorName?: string;
  message: string;
  timestamp: Date;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  lastEvent: RealtimeEventNotification | null;
  clearLastEvent: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  lastEvent: null,
  clearLastEvent: () => {},
});

function getSocketServerUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventNotification | null>(null);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLastEvent = useCallback(() => {
    setLastEvent(null);
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const triggerNotification = useCallback((notification: RealtimeEventNotification) => {
    setLastEvent(notification);
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setLastEvent(null);
      clearTimerRef.current = null;
    }, 6000);
  }, []);

  useEffect(() => {
    const handleAuthChange = (token: string | null) => {
      const activeToken = token || localStorage.getItem('emr_token');

      if (!activeToken) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      if (socketRef.current?.connected) {
        return;
      }

      const serverUrl = getSocketServerUrl();
      const newSocket = io(serverUrl, {
        auth: { token: activeToken },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        setIsReconnecting(false);

        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
        void queryClient.invalidateQueries({ queryKey: ['slots'] });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.io.on('reconnect_attempt', () => {
        setIsReconnecting(true);
      });

      newSocket.io.on('reconnect', () => {
        setIsConnected(true);
        setIsReconnecting(false);
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
        void queryClient.invalidateQueries({ queryKey: ['slots'] });
      });

      newSocket.on('appointment:created', (payload: RealtimeAppointmentPayload) => {
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
        void queryClient.invalidateQueries({ queryKey: ['slots'] });

        const appt = payload.appointment;
        const patientName = appt?.patient?.fullName || 'Patient';
        const doctorName = appt?.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor';

        triggerNotification({
          action: 'CREATED',
          appointmentId: appt.id,
          patientName,
          doctorName,
          message: `New appointment booked for ${patientName} with ${doctorName} at ${appt.startTime}`,
          timestamp: new Date(),
        });
      });

      newSocket.on('appointment:updated', (payload: RealtimeAppointmentPayload) => {
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
        void queryClient.invalidateQueries({ queryKey: ['slots'] });

        const appt = payload.appointment;
        const patientName = appt?.patient?.fullName || 'Patient';
        let detail = 'Appointment details updated';
        if (payload.action === 'STATUS_CHANGED') {
          detail = `Status changed to ${appt.status}`;
        } else if (payload.action === 'RESCHEDULED') {
          detail = `Rescheduled to ${appt.date} at ${appt.startTime}`;
        }

        triggerNotification({
          action: payload.action,
          appointmentId: appt.id,
          patientName,
          message: `${patientName}'s appointment: ${detail}`,
          timestamp: new Date(),
        });
      });

      newSocket.on('appointment:cancelled', (payload: RealtimeAppointmentPayload) => {
        void queryClient.invalidateQueries({ queryKey: ['appointments'] });
        void queryClient.invalidateQueries({ queryKey: ['slots'] });

        const appt = payload.appointment;
        const patientName = appt?.patient?.fullName || 'Patient';

        triggerNotification({
          action: 'CANCELLED',
          appointmentId: appt.id,
          patientName,
          message: `Appointment for ${patientName} was cancelled`,
          timestamp: new Date(),
        });
      });
    };

    handleAuthChange(tokenManager.getToken());

    const unsubscribe = tokenManager.subscribe(handleAuthChange);

    return () => {
      unsubscribe();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [queryClient, triggerNotification]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isReconnecting,
        lastEvent,
        clearLastEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };
