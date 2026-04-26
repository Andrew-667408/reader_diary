import { createAssistant, createSmartappDebugger } from '@salutejs/client';

let assistant;

export const initAssistant = (getState) => {
  if (assistant) return assistant;
  if (process.env.NODE_ENV === 'development') {
    assistant = createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: { defaultText: 'Говорите!', screenshotMode: false, tabIndex: -1 },
    });
  } else {
    assistant = createAssistant({ getState });
  }
  assistant.on('error', (e) => console.warn('assistant error', e));
  return assistant;
};

export const sendAction = (action_id, parameters = {}) => {
  if (!assistant) return;
  assistant.sendData({ action: { action_id, parameters } });
};
