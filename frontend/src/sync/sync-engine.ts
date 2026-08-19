import { ExpenseApi } from "../data/expense-api";
import { SyncAction } from "../enums/sync-action";
import { SyncStatus } from "../enums/sync-status";
import { ComparisonContext } from "../models/comparison-context";
import { DailyExpense } from "../models/daily-expense";
import { SyncDecision } from "../models/sync-decision";
import { ExpenseStorage } from "../storage/expense-storage";

export class SyncEngine {
  constructor(
    private readonly storage: ExpenseStorage,
    private readonly api: ExpenseApi,
  ) {}

  public async syncNow(year: number, month: number): Promise<void> {
    const context = await this.buildComparisonContext(year, month);

    await this.reconcileCurrentMonth(context);
  }

  public async syncExpense(expenseDate: string): Promise<void> {
    const local = await this.storage.load(expenseDate);

    if (!local) return;

    const [yearText, monthText] = expenseDate.split("-");
    const remoteRecords = await this.api.loadMonth(
      Number(yearText),
      Number(monthText),
    );
    const remote =
      remoteRecords.find((record) => record.expenseDate === expenseDate) ??
      null;

    const decision = this.compareRecord(local, remote);
    await this.executeDecision(decision);

    // Equal timestamps mean the same record is already on the server. A local
    // edit remains Pending until this acknowledgement is written locally.
    if (
      decision.action === SyncAction.None &&
      local.syncStatus !== SyncStatus.Synced
    ) {
      await this.storage.save({ ...local, syncStatus: SyncStatus.Synced });
    }
  }

  private async buildComparisonContext(
    year: number,
    month: number,
  ): Promise<ComparisonContext> {
    const localRecords = await this.storage.getAllByMonth(year, month);

    const remoteRecords = await this.api.loadMonth(year, month);

    const localMap = this.toMap(localRecords);
    const remoteMap = this.toMap(remoteRecords);

    const dateSet = new Set<string>();

    for (const date of localMap.keys()) {
      dateSet.add(date);
    }

    for (const date of remoteMap.keys()) {
      dateSet.add(date);
    }

    return {
      localMap,
      remoteMap,
      allDates: Array.from(dateSet),
    };
  }

  private toMap(records: DailyExpense[]): Map<string, DailyExpense> {
    const map = new Map<string, DailyExpense>();
    for (const record of records) {
      map.set(record.expenseDate, record);
    }
    return map;
  }

  private async reconcileCurrentMonth(
    context: ComparisonContext,
  ): Promise<void> {
    for (const expenseDate of context.allDates) {
      const local = context.localMap.get(expenseDate) ?? null;

      const remote = context.remoteMap.get(expenseDate) ?? null;

      const decision = this.compareRecord(local, remote);

      await this.executeDecision(decision);

      // Equal timestamps mean the same record is already on the server. A
      // local edit remains Pending until this acknowledgement is written
      // locally. See the identical fix in syncExpense() above.
      if (
        decision.action === SyncAction.None &&
        local !== null &&
        local.syncStatus !== SyncStatus.Synced
      ) {
        await this.storage.save({ ...local, syncStatus: SyncStatus.Synced });
      }
    }
  }

  private compareRecord(
    local: DailyExpense | null,
    remote: DailyExpense | null,
  ): SyncDecision {
    if (local === null && remote === null) {
      return {
        action: SyncAction.None,
      };
    }

    if (local !== null && remote === null) {
      return {
        action: SyncAction.LocalToRemote,
        sourceRecord: local,
      };
    }

    if (local === null && remote !== null) {
      return {
        action: SyncAction.RemoteToLocal,
        sourceRecord: remote,
      };
    }

    const localTime = Date.parse(local!.lastModifiedUtc);
    const remoteTime = Date.parse(remote!.lastModifiedUtc);

    const localValid = !isNaN(localTime);
    const remoteValid = !isNaN(remoteTime);

    if (localValid && !remoteValid) {
      return {
        action: SyncAction.LocalToRemote,
        sourceRecord: local!,
      };
    }

    if (!localValid && remoteValid) {
      return {
        action: SyncAction.RemoteToLocal,
        sourceRecord: remote!,
      };
    }

    if (localValid && remoteValid) {
      if (localTime > remoteTime) {
        return {
          action: SyncAction.LocalToRemote,
          sourceRecord: local!,
        };
      }

      if (remoteTime > localTime) {
        return {
          action: SyncAction.RemoteToLocal,
          sourceRecord: remote!,
        };
      }
    }

    return {
      action: SyncAction.None,
    };
  }

  private async executeDecision(decision: SyncDecision): Promise<void> {
    switch (decision.action) {
      case SyncAction.None:
        return;

      case SyncAction.LocalToRemote: {
        const syncedRecord = {
          ...decision.sourceRecord!,
          syncStatus: SyncStatus.Synced,
        };

        await this.api.save(decision.sourceRecord!);

        await this.storage.save(syncedRecord);

        return;
      }

      case SyncAction.RemoteToLocal: {
        const syncedRecord = {
          ...decision.sourceRecord!,
          syncStatus: SyncStatus.Synced,
        };

        await this.storage.save(syncedRecord);

        return;
      }
    }
  }
}
