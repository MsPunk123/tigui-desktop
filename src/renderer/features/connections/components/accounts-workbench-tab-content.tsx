import { Database, RefreshCw, Rows3, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useConnectionsModuleContext } from '@/renderer/app/modules/connections/connections-module-provider';
import { useWorkbench } from '@/renderer/app/workbench';
import {
  type AccountFlagName,
  decodeAccountFlags,
  getAccountFlagMeta,
} from '@/renderer/features/connections/mappers/account-flags';
import { formatTigerBeetleTimestamp } from '@/renderer/features/connections/mappers/format-tigerbeetle-timestamp';
import {
  datetimeLocalUtcToEpochNs,
  epochNsToDatetimeLocalUtc,
} from '@/renderer/features/connections/mappers/timestamp-filter';
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/shared/components/ui';
import type {
  AccountBalancePointDto,
  AccountRecordDto,
  AccountsQueryRequest,
  AccountsQueryState,
  AccountsViewPreferences,
} from '@/shared/connections';

type AccountsWorkbenchTabContentProps = {
  connectionId: string;
};

type AccountsLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

type HistoryLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

const DEFAULT_QUERY_STATE: AccountsQueryState = {
  ledger: '',
  code: '',
  userData128: '',
  userData64: '',
  userData32: '',
  timestampMin: '',
  timestampMax: '',
  sort: 'desc',
};

const DEFAULT_VIEW_PREFERENCES: AccountsViewPreferences = {
  showAllDetailsInRows: false,
  showRawDetailsPanel: true,
  tColumnsEnabled: true,
  debitCreditColorMode: 'semantic_fixed',
  accountsQueryState: DEFAULT_QUERY_STATE,
};

export const AccountsWorkbenchTabContent = ({ connectionId }: AccountsWorkbenchTabContentProps) => {
  const { profiles, connectConnection } = useConnectionsModuleContext();
  const { activeTabId } = useWorkbench();
  const profile = profiles.find((item) => item.id === connectionId) ?? null;

  const [loadState, setLoadState] = useState<AccountsLoadState>({ status: 'idle' });
  const [items, setItems] = useState<AccountRecordDto[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [nextCursorTimestampMax, setNextCursorTimestampMax] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewPreferences, setViewPreferences] =
    useState<AccountsViewPreferences>(DEFAULT_VIEW_PREFERENCES);
  const [queryState, setQueryState] = useState<AccountsQueryState>(DEFAULT_QUERY_STATE);
  const [timestampFilterInputs, setTimestampFilterInputs] = useState({
    timestampMinLocal: '',
    timestampMaxLocal: '',
  });
  const [historyLoadState, setHistoryLoadState] = useState<HistoryLoadState>({ status: 'idle' });
  const [historyItems, setHistoryItems] = useState<AccountBalancePointDto[]>([]);

  const selectedAccount =
    items.find((item) => item.id === selectedAccountId) ?? items.at(0) ?? null;
  const selectedDecodedFlags = useMemo(
    () => (selectedAccount ? decodeAccountFlags(selectedAccount.flags) : null),
    [selectedAccount],
  );
  const selectedFormattedTimestamp = useMemo(
    () => (selectedAccount ? formatTigerBeetleTimestamp(selectedAccount.timestamp) : null),
    [selectedAccount],
  );
  const selectedHasHistory = selectedDecodedFlags?.activeFlags.includes('history') ?? false;

  const updateViewPreferences = async (patch: Partial<AccountsViewPreferences>) => {
    const optimistic: AccountsViewPreferences = {
      ...viewPreferences,
      ...patch,
      accountsQueryState: patch.accountsQueryState
        ? {
            ...viewPreferences.accountsQueryState,
            ...patch.accountsQueryState,
          }
        : viewPreferences.accountsQueryState,
    };
    setViewPreferences(optimistic);
    try {
      const next = await window.tigui.updateAccountsViewPreferences(connectionId, patch);
      setViewPreferences(next);
    } catch {
      setViewPreferences(viewPreferences);
    }
  };

  const fetchFirstPage = async (state: AccountsQueryState) => {
    setLoadState({ status: 'loading' });
    try {
      const result = await window.tigui.queryAccounts(connectionId, {
        limit: 100,
        query: toQueryRequest(state),
      });
      if (!result.ok) {
        setLoadState({ status: 'error', message: result.message });
        return;
      }

      const firstAccount = result.page.items.at(0) ?? null;
      setItems(result.page.items);
      setSelectedAccountId(firstAccount?.id ?? null);
      setNextCursorTimestampMax(result.page.nextCursorTimestampMax ?? null);
      setLoadState({ status: 'idle' });
    } catch (error) {
      setLoadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load accounts.',
      });
    }
  };

  const loadMore = async () => {
    if (!nextCursorTimestampMax) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await window.tigui.queryAccounts(connectionId, {
        limit: 100,
        cursorTimestampMax: nextCursorTimestampMax,
        query: toQueryRequest(queryState),
      });
      setIsLoadingMore(false);
      if (!result.ok) {
        setLoadState({ status: 'error', message: result.message });
        return;
      }

      setItems((previous) => [...previous, ...result.page.items]);
      setNextCursorTimestampMax(result.page.nextCursorTimestampMax ?? null);
    } catch (error) {
      setIsLoadingMore(false);
      setLoadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load more accounts.',
      });
    }
  };

  const applyQuery = async (nextState: AccountsQueryState) => {
    setQueryState(nextState);
    await updateViewPreferences({ accountsQueryState: nextState });
    await fetchFirstPage(nextState);
  };

  const resetQuery = async () => {
    setTimestampFilterInputs({
      timestampMinLocal: '',
      timestampMaxLocal: '',
    });
    await applyQuery(DEFAULT_QUERY_STATE);
  };

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const next = await window.tigui.getAccountsViewPreferences(connectionId);
        const normalized = next.showAllDetailsInRows
          ? next
          : { ...next, showRawDetailsPanel: true };
        setViewPreferences(normalized);
        const nextQueryState = normalized.accountsQueryState ?? DEFAULT_QUERY_STATE;
        setQueryState(nextQueryState);
        setTimestampFilterInputs({
          timestampMinLocal: epochNsToDatetimeLocalUtc(nextQueryState.timestampMin),
          timestampMaxLocal: epochNsToDatetimeLocalUtc(nextQueryState.timestampMax),
        });
      } catch {
        setViewPreferences(DEFAULT_VIEW_PREFERENCES);
        setQueryState(DEFAULT_QUERY_STATE);
        setTimestampFilterInputs({
          timestampMinLocal: '',
          timestampMaxLocal: '',
        });
      }
    };

    void loadPreferences();
  }, [connectionId]);

  useEffect(() => {
    if (!profile?.isConnected) {
      setItems([]);
      setSelectedAccountId(null);
      setNextCursorTimestampMax(null);
      setLoadState({ status: 'idle' });
      setHistoryItems([]);
      setHistoryLoadState({ status: 'idle' });
      return;
    }

    void fetchFirstPage(queryState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId, profile?.isConnected]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!profile?.isConnected || !selectedAccount || !selectedHasHistory) {
        setHistoryItems([]);
        setHistoryLoadState({ status: 'idle' });
        return;
      }

      setHistoryLoadState({ status: 'loading' });
      const result = await window.tigui.queryAccountBalances(connectionId, {
        accountId: selectedAccount.id,
        limit: 20,
        sort: 'desc',
      });
      if (!result.ok) {
        setHistoryLoadState({ status: 'error', message: result.message });
        return;
      }

      setHistoryItems(result.balances.items);
      setHistoryLoadState({ status: 'idle' });
    };

    if (viewPreferences.showRawDetailsPanel) {
      void loadHistory();
    }
  }, [
    connectionId,
    profile?.isConnected,
    selectedAccount,
    selectedHasHistory,
    viewPreferences.showRawDetailsPanel,
  ]);

  const selectedJson = useMemo(
    () => (selectedAccount ? JSON.stringify(selectedAccount, null, 2) : null),
    [selectedAccount],
  );

  if (!profile) {
    return (
      <Empty className="min-h-[280px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Rows3 className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Connection not found</EmptyTitle>
          <EmptyDescription>
            This accounts tab points to a connection that is no longer available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!profile.isConnected) {
    return (
      <Empty className="min-h-[280px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Database className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Connection is not connected</EmptyTitle>
          <EmptyDescription>
            Connect this profile to query accounts from TigerBeetle.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          type="button"
          variant="outline"
          onClick={() => void connectConnection(activeTabId ?? `accounts:${connectionId}`, profile)}
        >
          Connect
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 border-b px-2 py-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            {profile.name} ({items.length} loaded)
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            type="button"
            size="sm"
            variant={viewPreferences.tColumnsEnabled ? 'secondary' : 'outline'}
            onClick={() =>
              void updateViewPreferences({ tColumnsEnabled: !viewPreferences.tColumnsEnabled })
            }
            className="w-full justify-center whitespace-nowrap"
          >
            T columns
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const nextShowAll = !viewPreferences.showAllDetailsInRows;
              void updateViewPreferences({
                showAllDetailsInRows: nextShowAll,
                ...(nextShowAll ? {} : { showRawDetailsPanel: true }),
              });
            }}
            className="w-full justify-center whitespace-nowrap"
          >
            {viewPreferences.showAllDetailsInRows ? 'Compact rows' : 'Show all row details'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              void applyQuery({ ...queryState, sort: queryState.sort === 'desc' ? 'asc' : 'desc' })
            }
            className="w-full justify-center whitespace-nowrap"
          >
            {queryState.sort === 'desc' ? 'Newest first' : 'Oldest first'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void fetchFirstPage(queryState)}
            disabled={loadState.status === 'loading'}
            className="w-full justify-center whitespace-nowrap"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-2 py-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <Input
            placeholder="Ledger"
            value={queryState.ledger}
            onChange={(event) => setQueryState((p) => ({ ...p, ledger: event.target.value }))}
          />
          <Input
            placeholder="Code"
            value={queryState.code}
            onChange={(event) => setQueryState((p) => ({ ...p, code: event.target.value }))}
          />
          <Input
            placeholder="User Data 128"
            value={queryState.userData128}
            onChange={(event) => setQueryState((p) => ({ ...p, userData128: event.target.value }))}
          />
          <Input
            placeholder="User Data 64"
            value={queryState.userData64}
            onChange={(event) => setQueryState((p) => ({ ...p, userData64: event.target.value }))}
          />
          <Input
            placeholder="User Data 32"
            value={queryState.userData32}
            onChange={(event) => setQueryState((p) => ({ ...p, userData32: event.target.value }))}
          />
          <Input
            type="datetime-local"
            step="0.001"
            placeholder="Timestamp Min"
            value={timestampFilterInputs.timestampMinLocal}
            onChange={(event) => {
              const raw = event.target.value;
              setTimestampFilterInputs((previous) => ({
                ...previous,
                timestampMinLocal: raw,
              }));
              setQueryState((previous) => ({
                ...previous,
                timestampMin: datetimeLocalUtcToEpochNs(raw) ?? '',
              }));
            }}
          />
          <Input
            type="datetime-local"
            step="0.001"
            placeholder="Timestamp Max"
            value={timestampFilterInputs.timestampMaxLocal}
            onChange={(event) => {
              const raw = event.target.value;
              setTimestampFilterInputs((previous) => ({
                ...previous,
                timestampMaxLocal: raw,
              }));
              setQueryState((previous) => ({
                ...previous,
                timestampMax: datetimeLocalUtcToEpochNs(raw) ?? '',
              }));
            }}
          />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4 2xl:col-span-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void applyQuery(queryState)}
            >
              Apply
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void resetQuery()}>
              Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4 2xl:col-span-8">
            Timestamp pickers are interpreted as UTC and converted to epoch nanoseconds.
          </p>
        </div>

        <div
          className={[
            'grid min-h-0 min-w-0 flex-1 gap-3',
            viewPreferences.showRawDetailsPanel ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : '',
          ].join(' ')}
        >
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            {loadState.status === 'loading' ? (
              <p className="text-sm text-muted-foreground">Loading accounts...</p>
            ) : null}
            {loadState.status === 'error' ? (
              <p className="text-sm text-destructive">{loadState.message}</p>
            ) : null}
            {loadState.status === 'idle' && items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accounts found for this connection.
              </p>
            ) : null}

            {items.length > 0 ? (
              <div className="min-h-0 min-w-0 max-h-[65vh] max-w-full flex-1 overflow-x-auto overflow-y-auto rounded-md border">
                <table
                  className={[
                    'min-w-full w-max text-left text-xs',
                    viewPreferences.showAllDetailsInRows ? 'min-w-[1380px]' : 'min-w-[1040px]',
                  ].join(' ')}
                >
                  <thead className="sticky top-0 z-20 bg-muted/70 text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium">Ledger</th>
                      <th className="px-3 py-2 font-medium">Code</th>
                      <th
                        className={[
                          'px-3 py-2 text-right font-medium',
                          viewPreferences.tColumnsEnabled && 'bg-rose-50/70 text-rose-700',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Debit Pending
                      </th>
                      <th
                        className={[
                          'px-3 py-2 text-right font-medium',
                          viewPreferences.tColumnsEnabled && 'bg-rose-50/70 text-rose-700',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Debit Posted
                      </th>
                      <th
                        className={[
                          'px-3 py-2 text-right font-medium',
                          viewPreferences.tColumnsEnabled && 'bg-emerald-50/70 text-emerald-700',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Credit Pending
                      </th>
                      <th
                        className={[
                          'px-3 py-2 text-right font-medium',
                          viewPreferences.tColumnsEnabled && 'bg-emerald-50/70 text-emerald-700',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Credit Posted
                      </th>
                      {viewPreferences.showAllDetailsInRows ? (
                        <>
                          <th className="px-3 py-2 font-medium">User Data 128</th>
                          <th className="px-3 py-2 font-medium">User Data 64</th>
                          <th className="px-3 py-2 font-medium">User Data 32</th>
                        </>
                      ) : null}
                      <th className="px-3 py-2 font-medium">Flags</th>
                      <th className="px-3 py-2 text-right font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((account) => {
                      const isSelected = selectedAccount?.id === account.id;

                      return (
                        <tr
                          key={account.id}
                          className={[
                            'cursor-pointer border-t transition-colors',
                            isSelected ? 'bg-primary/10' : 'hover:bg-muted/30',
                          ].join(' ')}
                          onClick={() => setSelectedAccountId(account.id)}
                        >
                          <td className="px-3 py-2 font-mono">{account.id}</td>
                          <td className="px-3 py-2">{account.ledger}</td>
                          <td className="px-3 py-2">{account.code}</td>
                          <td
                            className={[
                              'px-3 py-2 text-right font-mono',
                              viewPreferences.tColumnsEnabled && 'bg-rose-50/40',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {account.debitsPending}
                          </td>
                          <td
                            className={[
                              'px-3 py-2 text-right font-mono',
                              viewPreferences.tColumnsEnabled && 'bg-rose-50/40',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {account.debitsPosted}
                          </td>
                          <td
                            className={[
                              'px-3 py-2 text-right font-mono',
                              viewPreferences.tColumnsEnabled && 'bg-emerald-50/40',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {account.creditsPending}
                          </td>
                          <td
                            className={[
                              'px-3 py-2 text-right font-mono',
                              viewPreferences.tColumnsEnabled && 'bg-emerald-50/40',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {account.creditsPosted}
                          </td>
                          {viewPreferences.showAllDetailsInRows ? (
                            <>
                              <td className="px-3 py-2 font-mono">{account.userData128}</td>
                              <td className="px-3 py-2 font-mono">{account.userData64}</td>
                              <td className="px-3 py-2 text-right">{account.userData32}</td>
                            </>
                          ) : null}
                          <td className="px-3 py-2 align-top">
                            <AccountFlagsCell flags={account.flags} />
                          </td>
                          <td className="px-3 py-2 text-right align-top">
                            <TimestampCell rawTimestamp={account.timestamp} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {nextCursorTimestampMax ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </Button>
            ) : null}
          </div>

          {viewPreferences.showRawDetailsPanel ? (
            <div className="min-h-0 overflow-auto rounded-md border bg-muted/10 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Raw account details</p>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Close raw account details"
                  onClick={() => void updateViewPreferences({ showRawDetailsPanel: false })}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {selectedDecodedFlags ? (
                <div className="mb-3 space-y-2 rounded-md border bg-background/60 p-2">
                  <p className="text-xs font-medium text-muted-foreground">Decoded flags</p>
                  <p className="text-xs">
                    Raw value: <span className="font-mono">{selectedDecodedFlags.rawValue}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDecodedFlags.isNone ? (
                      <Badge variant="outline">None</Badge>
                    ) : (
                      selectedDecodedFlags.activeFlags.map((flag) => (
                        <AccountFlagBadge key={`selected-${flag}`} flag={flag} />
                      ))
                    )}
                    {selectedDecodedFlags.unknownBits > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-100 text-amber-800"
                      >
                        Unknown ({selectedDecodedFlags.unknownBits})
                      </Badge>
                    ) : null}
                  </div>
                  {selectedDecodedFlags.activeFlags.length > 0 ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {selectedDecodedFlags.activeFlags.map((flag) => {
                        const meta = getAccountFlagMeta(flag);
                        return <li key={`hint-${flag}`}>{meta.hint}</li>;
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {selectedFormattedTimestamp ? (
                <div className="mb-3 space-y-1 rounded-md border bg-background/60 p-2">
                  <p className="text-xs font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-xs">
                    Human UTC:{' '}
                    <span className="font-mono">{selectedFormattedTimestamp.displayUtc}</span>
                  </p>
                  <p className="text-xs">
                    Raw epoch ns:{' '}
                    <span className="font-mono">{selectedFormattedTimestamp.rawNs}</span>
                  </p>
                  <p className="text-xs">
                    ISO UTC: <span className="font-mono">{selectedFormattedTimestamp.isoUtc}</span>
                  </p>
                </div>
              ) : null}

              {selectedJson ? (
                <pre className="mb-3 max-h-52 overflow-auto text-xs whitespace-pre-wrap">
                  {selectedJson}
                </pre>
              ) : (
                <p className="mb-3 text-xs text-muted-foreground">
                  Select an account row to inspect details.
                </p>
              )}

              <div className="space-y-2 border-t pt-2">
                <p className="text-xs font-medium text-muted-foreground">Balance history</p>
                {!selectedAccount ? (
                  <p className="text-xs text-muted-foreground">
                    Select an account to load history.
                  </p>
                ) : !selectedHasHistory ? (
                  <p className="text-xs text-muted-foreground">
                    History not enabled for this account.
                  </p>
                ) : historyLoadState.status === 'loading' ? (
                  <p className="text-xs text-muted-foreground">Loading balance history...</p>
                ) : historyLoadState.status === 'error' ? (
                  <p className="text-xs text-destructive">{historyLoadState.message}</p>
                ) : historyItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No historical balances found.</p>
                ) : (
                  <div className="max-h-44 overflow-auto rounded border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-1 text-right">Debits Posted</th>
                          <th className="px-2 py-1 text-right">Credits Posted</th>
                          <th className="px-2 py-1 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyItems.map((item) => (
                          <tr key={item.timestamp} className="border-t">
                            <td className="px-2 py-1 text-right font-mono">{item.debitsPosted}</td>
                            <td className="px-2 py-1 text-right font-mono">{item.creditsPosted}</td>
                            <td className="px-2 py-1 text-right">
                              <TimestampCell rawTimestamp={item.timestamp} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const AccountFlagsCell = ({ flags }: { flags: number }) => {
  const decoded = decodeAccountFlags(flags);

  return (
    <div className="space-y-1">
      <p className="text-right font-mono">{decoded.rawValue}</p>
      <div className="flex flex-wrap justify-end gap-1">
        {decoded.isNone ? <Badge variant="outline">None</Badge> : null}
        {decoded.activeFlags.map((flag) => (
          <AccountFlagBadge key={`${flags}-${flag}`} flag={flag} />
        ))}
        {decoded.unknownBits > 0 ? (
          <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
            Unknown ({decoded.unknownBits})
          </Badge>
        ) : null}
      </div>
    </div>
  );
};

const TimestampCell = ({ rawTimestamp }: { rawTimestamp: string }) => {
  const formatted = formatTigerBeetleTimestamp(rawTimestamp);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default font-mono whitespace-nowrap">{formatted.displayUtc}</span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p>
            Raw ns: <span className="font-mono">{formatted.rawNs}</span>
          </p>
          <p>
            ISO UTC: <span className="font-mono">{formatted.isoUtc}</span>
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const AccountFlagBadge = ({ flag }: { flag: AccountFlagName }) => {
  const meta = getAccountFlagMeta(flag);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={toFlagBadgeClassName(flag)}
          aria-label={`${meta.label} flag`}
        >
          {meta.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{meta.tooltip}</TooltipContent>
    </Tooltip>
  );
};

const toFlagBadgeClassName = (flag: AccountFlagName): string => {
  switch (flag) {
    case 'history':
      return 'border-blue-300 bg-blue-100 text-blue-800';
    case 'closed':
      return 'border-zinc-300 bg-zinc-200 text-zinc-800';
    case 'imported':
      return 'border-indigo-300 bg-indigo-100 text-indigo-800';
    case 'linked':
      return 'border-violet-300 bg-violet-100 text-violet-800';
    case 'debits_must_not_exceed_credits':
      return 'border-rose-300 bg-rose-100 text-rose-800';
    case 'credits_must_not_exceed_debits':
      return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    default:
      return '';
  }
};

const parseIntegerOrUndefined = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return undefined;
  }
  return parsed;
};

const normalizeBigintString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toQueryRequest = (state: AccountsQueryState): AccountsQueryRequest => ({
  ledger: parseIntegerOrUndefined(state.ledger),
  code: parseIntegerOrUndefined(state.code),
  userData128: normalizeBigintString(state.userData128),
  userData64: normalizeBigintString(state.userData64),
  userData32: parseIntegerOrUndefined(state.userData32),
  timestampMin: normalizeBigintString(state.timestampMin),
  timestampMax: normalizeBigintString(state.timestampMax),
  sort: state.sort,
});
