import { useEffect, useState } from 'react';

import type { ConnectionProfile, ConnectionValidationError } from '@/shared/connections';

import type { ConnectionFormValues } from '../components/connection-form';
import {
  EMPTY_CONNECTION_FORM,
  toConnectionFormValues,
  toProfileInput,
} from '../mappers/to-profile-input';

export type EditorState =
  | { mode: 'closed' }
  | { mode: 'create'; initialValues: ConnectionFormValues }
  | { mode: 'edit'; profile: ConnectionProfile; initialValues: ConnectionFormValues };

type UseConnectionsWorkspaceResult = {
  profiles: ConnectionProfile[];
  connectedConnectionIds: string[];
  editorState: EditorState;
  validationErrors: ConnectionValidationError[];
  notice: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  openCreate: (initialValues?: ConnectionFormValues) => void;
  openEdit: (profile: ConnectionProfile) => void;
  closeEditor: () => void;
  submitEditor: (values: ConnectionFormValues) => Promise<void>;
  connectConnection: (profile: ConnectionProfile) => Promise<void>;
  deleteConnection: (profile: ConnectionProfile) => Promise<void>;
  testConnection: (profile: ConnectionProfile) => Promise<void>;
};

export const useConnectionsWorkspace = (): UseConnectionsWorkspaceResult => {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [connectedConnectionIds, setConnectedConnectionIds] = useState<string[]>([]);
  const [editorState, setEditorState] = useState<EditorState>({ mode: 'closed' });
  const [validationErrors, setValidationErrors] = useState<ConnectionValidationError[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadProfiles = async () => {
    const [nextProfiles, nextConnectedIds] = await Promise.all([
      window.tigui.listConnections(),
      window.tigui.getConnectedConnectionIds(),
    ]);
    setProfiles(nextProfiles);
    setConnectedConnectionIds(nextConnectedIds);
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
    setEditorState({ mode: 'closed' });
    setValidationErrors([]);
  };

  const submitEditor = async (values: ConnectionFormValues) => {
    setValidationErrors([]);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const payload = toProfileInput(values);
      const result =
        editorState.mode === 'edit'
          ? await window.tigui.updateConnection(editorState.profile.id, payload)
          : await window.tigui.createConnection(payload);

      if (!result.ok) {
        setValidationErrors(result.validationErrors ?? []);
        setNotice(result.message);
        return;
      }

      await reloadProfiles();
      closeEditor();
      setNotice(
        editorState.mode === 'edit'
          ? 'Connection updated successfully.'
          : 'Connection created successfully.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreate = (initialValues: ConnectionFormValues = EMPTY_CONNECTION_FORM) => {
    setNotice(null);
    setValidationErrors([]);
    setEditorState({
      mode: 'create',
      initialValues,
    });
  };

  const openEdit = (profile: ConnectionProfile) => {
    setNotice(null);
    setValidationErrors([]);
    setEditorState({
      mode: 'edit',
      profile,
      initialValues: toConnectionFormValues(profile),
    });
  };

  const connectConnection = async (profile: ConnectionProfile) => {
    const result = await window.tigui.connectConnection(profile.id);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setConnectedConnectionIds(result.connectedConnectionIds);
    await reloadProfiles();
    setNotice(`"${profile.name}" is now connected.`);
  };

  const deleteConnection = async (profile: ConnectionProfile) => {
    const confirmed = window.confirm(`Delete connection "${profile.name}"?`);
    if (!confirmed) {
      return;
    }

    const result = await window.tigui.deleteConnection(profile.id);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    await reloadProfiles();
    setNotice(`"${profile.name}" was deleted.`);
  };

  const testConnection = async (profile: ConnectionProfile) => {
    setNotice(`Testing "${profile.name}"...`);
    const result = await window.tigui.testConnection(profile.id);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    const addressSummary = result.result.addressResults
      .map((item) => (item.reachable ? `${item.address}: ok` : `${item.address}: ${item.message}`))
      .join(', ');
    setNotice(`${result.result.message} ${addressSummary}`);
  };

  return {
    profiles,
    connectedConnectionIds,
    editorState,
    validationErrors,
    notice,
    isLoading,
    isSubmitting,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    connectConnection,
    deleteConnection,
    testConnection,
  };
};
