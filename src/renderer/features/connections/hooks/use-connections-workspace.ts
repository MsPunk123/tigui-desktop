import { useEffect, useState } from 'react';

import type { ConnectionProfile, ConnectionValidationError } from '@/shared/connections';

import type { ConnectionFormValues } from '../components/connection-form';
import { EMPTY_CONNECTION_FORM, toProfileInput } from '../mappers/to-profile-input';

export type ConnectionOverlayState =
  | { mode: 'closed' }
  | { mode: 'create'; originTabId: string | null }
  | { mode: 'edit'; connectionId: string; originTabId: string };

export type ConnectionTabUiState = {
  notice: string | null;
  validationErrors: ConnectionValidationError[];
  isBusy: boolean;
  lastAction: string | null;
};

const EMPTY_CONNECTION_TAB_UI_STATE: ConnectionTabUiState = {
  notice: null,
  validationErrors: [],
  isBusy: false,
  lastAction: null,
};

export type ConnectionsWorkspace = {
  profiles: ConnectionProfile[];
  overlayState: ConnectionOverlayState;
  isLoading: boolean;
  isSubmitting: boolean;
  openCreate: (originTabId: string | null) => void;
  openEdit: (originTabId: string, profile: ConnectionProfile) => void;
  closeEditor: () => void;
  submitEditor: (tabId: string | null, values: ConnectionFormValues) => Promise<void>;
  connectConnection: (tabId: string, profile: ConnectionProfile) => Promise<void>;
  deleteConnection: (tabId: string, profile: ConnectionProfile) => Promise<void>;
  testConnection: (tabId: string, profile: ConnectionProfile) => Promise<void>;
  getTabUiState: (tabId: string | null) => ConnectionTabUiState;
  ensureTabUiState: (tabId: string) => void;
  setTabUiState: (tabId: string, patch: Partial<ConnectionTabUiState>) => void;
  clearTabUiState: (tabId: string) => void;
};

export const useConnectionsWorkspace = (): ConnectionsWorkspace => {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [overlayState, setOverlayState] = useState<ConnectionOverlayState>({ mode: 'closed' });
  const [tabUiStateByTabId, setTabUiStateByTabId] = useState<Record<string, ConnectionTabUiState>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTabUiState = (tabId: string | null): ConnectionTabUiState => {
    if (!tabId) {
      return EMPTY_CONNECTION_TAB_UI_STATE;
    }

    return tabUiStateByTabId[tabId] ?? EMPTY_CONNECTION_TAB_UI_STATE;
  };

  const ensureTabUiState = (tabId: string) => {
    setTabUiStateByTabId((previous) => {
      if (previous[tabId]) {
        return previous;
      }

      return {
        ...previous,
        [tabId]: EMPTY_CONNECTION_TAB_UI_STATE,
      };
    });
  };

  const setTabUiState = (tabId: string, patch: Partial<ConnectionTabUiState>) => {
    setTabUiStateByTabId((previous) => ({
      ...previous,
      [tabId]: {
        ...(previous[tabId] ?? EMPTY_CONNECTION_TAB_UI_STATE),
        ...patch,
      },
    }));
  };

  const clearTabUiState = (tabId: string) => {
    setTabUiStateByTabId((previous) => {
      if (!previous[tabId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[tabId];
      return next;
    });
  };

  const reloadProfiles = async () => {
    const nextProfiles = await window.tigui.listConnections();
    setProfiles(nextProfiles);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await reloadProfiles();
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const closeEditor = () => {
    setOverlayState({ mode: 'closed' });
  };

  const submitEditor = async (tabId: string | null, values: ConnectionFormValues) => {
    if (tabId) {
      setTabUiState(tabId, {
        notice: null,
        validationErrors: [],
        isBusy: true,
        lastAction: overlayState.mode === 'edit' ? 'edit' : 'create',
      });
    }
    setIsSubmitting(true);

    try {
      const payload = toProfileInput(values);
      const result =
        overlayState.mode === 'edit'
          ? await window.tigui.updateConnection(overlayState.connectionId, payload)
          : await window.tigui.createConnection(payload);

      if (!result.ok) {
        if (tabId) {
          setTabUiState(tabId, {
            validationErrors: result.validationErrors ?? [],
            notice: result.message,
            isBusy: false,
          });
        }
        return;
      }

      await reloadProfiles();
      closeEditor();
      if (tabId) {
        setTabUiState(tabId, {
          notice:
            overlayState.mode === 'edit'
              ? 'Connection updated successfully.'
              : 'Connection created successfully.',
          validationErrors: [],
          isBusy: false,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreate = (originTabId: string | null) => {
    if (originTabId) {
      setTabUiState(originTabId, {
        notice: null,
        validationErrors: [],
      });
    }
    setOverlayState({ mode: 'create', originTabId });
  };

  const openEdit = (originTabId: string, profile: ConnectionProfile) => {
    setTabUiState(originTabId, {
      notice: null,
      validationErrors: [],
    });
    setOverlayState({
      mode: 'edit',
      connectionId: profile.id,
      originTabId,
    });
  };

  const connectConnection = async (tabId: string, profile: ConnectionProfile) => {
    ensureTabUiState(tabId);
    setTabUiState(tabId, {
      notice: null,
      validationErrors: [],
      isBusy: true,
      lastAction: 'connect',
    });
    const result = await window.tigui.connectConnection(profile.id);
    if (!result.ok) {
      setTabUiState(tabId, {
        notice: result.message,
        isBusy: false,
      });
      return;
    }

    await reloadProfiles();
    setTabUiState(tabId, {
      notice: `"${profile.name}" is now connected.`,
      isBusy: false,
    });
  };

  const deleteConnection = async (tabId: string, profile: ConnectionProfile) => {
    const confirmed = window.confirm(`Delete connection "${profile.name}"?`);
    if (!confirmed) {
      return;
    }

    ensureTabUiState(tabId);
    setTabUiState(tabId, {
      notice: null,
      validationErrors: [],
      isBusy: true,
      lastAction: 'delete',
    });
    const result = await window.tigui.deleteConnection(profile.id);
    if (!result.ok) {
      setTabUiState(tabId, {
        notice: result.message,
        isBusy: false,
      });
      return;
    }

    await reloadProfiles();
    setTabUiState(tabId, {
      notice: `"${profile.name}" was deleted.`,
      isBusy: false,
    });
  };

  const testConnection = async (tabId: string, profile: ConnectionProfile) => {
    ensureTabUiState(tabId);
    setTabUiState(tabId, {
      notice: `Testing "${profile.name}"...`,
      validationErrors: [],
      isBusy: true,
      lastAction: 'test',
    });
    const result = await window.tigui.testConnection(profile.id);
    if (!result.ok) {
      setTabUiState(tabId, {
        notice: result.message,
        isBusy: false,
      });
      return;
    }

    const addressSummary = result.result.addressResults
      .map((item) => (item.reachable ? `${item.address}: ok` : `${item.address}: ${item.message}`))
      .join(', ');
    setTabUiState(tabId, {
      notice: `${result.result.message} ${addressSummary}`,
      isBusy: false,
    });
  };

  return {
    profiles,
    overlayState,
    isLoading,
    isSubmitting,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    connectConnection,
    deleteConnection,
    testConnection,
    getTabUiState,
    ensureTabUiState,
    setTabUiState,
    clearTabUiState,
  };
};
