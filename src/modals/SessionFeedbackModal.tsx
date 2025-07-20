import React from 'react';
import { ThemeKey } from '../types';

const SessionFeedbackModal = ({
  onSubmit,
  onClose,
  theme,
}: {
  onSubmit: (feedback: { focusScore: number; interruptions: number; notes: string }) => void;
  onClose: () => void;
  theme: ThemeKey;
}) => {
  // ...modal implementation (to be filled in from App.tsx)...
  return null;
};

export default SessionFeedbackModal; 