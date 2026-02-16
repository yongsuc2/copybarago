import { AttendanceDataTable } from '../data/AttendanceDataTable';

export class AttendanceSystem {
  checkedDays: boolean[];
  cycleStartDate: string;
  lastCheckDate: string;

  constructor() {
    this.checkedDays = new Array(AttendanceDataTable.getTotalDays()).fill(false);
    this.cycleStartDate = this.getTodayString();
    this.lastCheckDate = '';
  }

  getCurrentDay(): number {
    for (let i = 0; i < this.checkedDays.length; i++) {
      if (!this.checkedDays[i]) return i;
    }
    return this.checkedDays.length;
  }

  canCheckIn(): boolean {
    return this.lastCheckDate !== this.getTodayString() && this.getCurrentDay() < AttendanceDataTable.getTotalDays();
  }

  checkIn(): number {
    if (!this.canCheckIn()) return -1;
    const dayIndex = this.getCurrentDay();
    this.checkedDays[dayIndex] = true;
    this.lastCheckDate = this.getTodayString();
    return dayIndex + 1;
  }

  isComplete(): boolean {
    return this.checkedDays.every(d => d);
  }

  resetCycle(): void {
    this.checkedDays = new Array(AttendanceDataTable.getTotalDays()).fill(false);
    this.cycleStartDate = this.getTodayString();
    this.lastCheckDate = '';
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }
}
